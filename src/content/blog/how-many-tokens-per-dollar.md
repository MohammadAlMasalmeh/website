---
title: "How many tokens/$ can you get?"
description: "We're rebuilding the inference stack for throughput per dollar, starting with underused Amazon Inferentia chips."
date: 2026-11-04
---

By Mo and Shrey

## Motivation

We are making 2 bets about the future.   
**First is that in the limit, latency will be valued less than throughput.**

Week over week, models get more intelligent, and more independent. Agents are now doing tasks for us completely autonomously. We even see startups developing research loops for agents to autonomously research problems across 6 months+ \!

Since humans are the only consumers of tokens who are latency sensitive (agents are not impatient like us\!), we noticed that as *humans get out of the loop*, per token latency matters less while cost/throughput matters more.

For example, when [OpenAI spent \~\$10 million dollars to solve Navier-Stokes](https://openai.com/index/navier-stokes-solution/) over 88 hours via autonomous agents, the time it took for each individual LLM request to complete did not matter (88 hours vs 100 hours is negligible), but rather the cost (\~\$10 million dollars in tokens). If magically someone could provide LLM inference that was 30% slower but 50% cheaper, that could enable more net experiments for the same price and be extremely economically valuable.

**Our second bet is that all frontier compute will be soaked up.** When OpenAI solved Navier-Stokes, they used a private, internal model; not the same GPT you and I have access to through [chatgpt.com](http://chatgpt.com). As models get more intelligent, we see labs having no reason to release them publicly, but rather to use them internally to directly solve the world's hardest problems like Navier-Stokes directly and increase company valuations.

At a certain point, it becomes infinitely more valuable to use compute to recursively improve internal models as every incremental increase in intelligence is so valuable that it makes no sense to use compute in any other way (ie, serving user demand).

While the compute crunch in datacenters will get worse, we still see many chips not in datacenters around the world that are being vastly underutilized. For example the gaming GPUs on your PC sit idle, the older AWS trainium chips have capacity, and (in the near future) the robots cleaning around your house have powerful AI chips that are already powered on and paid for but aren’t utilized\! Recently [Sam Altman talked](https://x.com/RT_on_X/status/2116458055999361152?a=NqW2B9asPa2xzyoMgYU&s=20) about how people owning local RAM is terrible for global utilization and we agree. Somehow, this globally underutilized and underpriced silicon needs to be utilized.

**Slug AI is building infrastructure that can run on this globally scattered and unconventional compute for a world of throughput.** 

Inference has always been built with low latency in mind and forced engineers to use frontier GPUs at low utilization. We’re throwing away everything that is known about inference and rebuilding the entire stack to be optimized for throughput per \$.

Rewriting kernels, using overlooked parallelism techniques, doing work offline (sorting requests by experts activated, batching aggressively, speculating for higher throughput, etc), choosing this “unconventional but cheap” spotty, distributed hardware instead of B300 nodes is all a part of our playbook. We’re starting off our quest by proving that we can harness underpriced, underutilized Amazon Inferentia chips to achieve real throughput / \$ gains on the pareto frontier.

## Building on Amazon Inferentia chips

### Choosing hardware and the model

As models got more intelligent and inference demand increased, the price of B200 Nvidia chips has skyrocketed 63% in the past 3 months on ORNN exchange. At the same time, second-tier chips like Amazon Trainium1 and Inferentia2 have stayed relatively stagnant in pricing.

![Price chart for Nvidia B200 GPUs, up about 63 percent over the past 3 months to $9.41 per GPU-hour.](/blog/how-many-tokens/image1.png)

These drastic price increases reveal a glaring disparity. On paper Amazon Inferentia2 and Trainium chips led nearly on all 3 mem bandwidth per \$, mem capacity per \$, and compute per \$, by a wide margin. ![Bar charts ranking chips at spot prices. Inferentia2 leads on memory bandwidth and memory capacity per dollar, but not on compute per dollar.](/blog/how-many-tokens/image2.png)

In reality, the software stack for these chips is nowhere near the level Nvidia has developed with CUDA. In fact, it is not even a trivial task to run a model on an Amazon chip like it is today with vLLM or SGLang on a Nvidia chip.

Despite the extreme lack of software support and prior work running modern model inference on AWS chips, we chose the inf2.xlarge because it offered an insane memory bandwidth for the price. We had 32 GB mem at about 820 GB/s, and 190 TFLOPS in BF16 (16-bit) across 2 cores at \$.076 / hour (spot) or 0.758 / hour (demand).

Going with this, we chose to build our inference around Qwen3.8-27B, because it scores 52 on Artificial Analysis intelligence benchmark (one of the highest for its model size), could fit in \~16GB of weights at FP4 (leaving 16GB for KV cache on chip), and is a good test for dense models. Qwen3.8-27B is served by Modal on OpenRouter for about \$0.04 in, \$2.30 out, and \$0.02 for cache read per million tokens.

To break even at Modal’s decode prices of \$2.30 out, we would need to achieve 9 tok/s at spot and 92 tok/s on demand pricing sustained on the Amazon chip.T Based on the raw FLOPs and memory bandwidth, the Inferentia 2 could achieve about 60 tok/s per user on a single request since every token has to read all \~13.6 GB of FP4 weights, and 820 GB/s ÷ 13.6 GB ≈ 60\. Since we care about global throughput (not latency), we can switch to spot instances and batch \~30 requests together, giving a throughput of 1,800 tok/sec and an absolute ceiling (compute bound, 190 TFLOPs / 56 GFLOPS per token \= 3,400 tok/sec). **Theoretically, the Amazon Inferntia2 chip is capable of producing \$28.15 of value/hr for costing only \$0.076 (370x) \- mind boggling economics.**

### Making the inference run

The challenge is clear: make Qwen 3.8 27B run on an AWS inf2.xlarge chip.

Firstly, the Inf2 chip core has no FP4 type and expanding to BF16 would take 24 GB per core (not possible). We decided to build weight only quantization in which the weights would stay in FP4, but everything else would run at BF16. The code running on the core would unpack the weights into BF16, and then do the math. This still gives us speedup in terms of memory capacity and bandwidth.

Secondly, this Qwen3.8 model has a hybrid mix of full attention AND gated delta attention. The pytorch code required for this uses a matrix calculation called triangular solve, which isn’t possible on an AWS infernetia chip because infernetia required fixed tensor sizes. We rewrote the model as a single graph to workaround this issue. 

Thirdly, we ran into lots of issues with the SDK stack. From Amazon Neuron 2.29 on, NxD Inference and NKI .3 kernels dropped Inf2, so we had to use the compiler directly on an old version and deal with lot’s of package version headaches. Luckily Claude was a big help here.

After all this, we had a working model running on inf2.xlarge, albeit extremely slow and costly:  
4.13 s per token on the chip, or 0.23 tok/s

![Terminal output of the first working run, at 4.13 seconds per step and a decode speed of 0.232 tokens per second.](/blog/how-many-tokens/image3.png)

### Optimizing for throughput

We’ve seen great success of LLMs hillclimbing tasks like kernel development, so we gave Claude Fable 5 a night to work on improving the throughput/second. From starting at 0.19 tok/sec to now \>122 tok/sec (**about 646x in speedups\!)**

![Step chart of Qwen3.8-27B throughput on one Inf2 chip, rising from 0.19 to 122.7 tokens per second, about 646x.](/blog/how-many-tokens/image4.png)

It added batching, kernel fusion, disk warming, and lowered the scratchpad page size. What’s interesting is that the Neuron docs state that you can’t change the page size below 512MB, but claude actually found that 64 MB values took effect and actually led to speedups\! This is because we are memory constrained and smaller page size led to less internal fragmentation leading to higher batch size able to fit.

## What’s next

We can see that it is viable to take the hardware that is hardly touched and turn it into gold by investing in the software stack. We are soon launching an API endpoint in which you can use Qwen 3.8 27B for a fraction of the cost of live prices on our website and are working to also get larger models like Kimi K3.1 Pro live soon.

At 122.7 tok/sec of throughput on a \$0.076/hour chip means that we can serve a million tokens at \$0.172. **This is 13.37× cheaper, or 92.52% cost reduction** against Modal’s pricing on OpenRouter.

Of course, this assumes we have enough requests to keep our compute busy, and the preemption of spot instances isn’t worst case scenario, and that prices on openrouter are at cost, and so on so forth. But regardless, it is clear to see an opportunity hidden where nobody else looked.

### Future

We see massive gains to be made 

- Spot instances extreme preemption  
- Working on not just aws but heterogeneous hardware whatever is available load balancing and kernels automatic (tractor guy)  
- Sorting batches  
- Spec dec before for throughput  
- Pipeline parallel more throughput / expert parallel (usually communication too bad)
