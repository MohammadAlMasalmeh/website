---
title: "Thesis"
description: "Why we think throughput per dollar will matter more than latency, and why we're building inference for scattered, underused chips."
date: 2026-11-04
---

By Shrey and Mo

We are making 2 bets about the future.  
**First is that in the limit, latency will be valued less than throughput.**

Week over week, models get more intelligent, and more independent. Agents are now doing tasks for us completely autonomously. We even see startups developing research loops for agents to autonomously research problems across 6 months+ !

Since humans are the only consumers of tokens who are latency sensitive (agents are not impatient like us!), we noticed that as *humans get out of the loop*, per token latency matters less while cost/throughput matters more.

For example, when [OpenAI spent \~$10 million dollars to solve Navier-Stokes](https://openai.com/index/navier-stokes-solution/) over 88 hours via autonomous agents, the time it took for each individual LLM request to complete did not matter (88 hours vs 100 hours is negligible), but rather the cost (\~$10 million dollars in tokens). If magically someone could provide LLM inference that was 30% slower but 50% cheaper, that could enable more net experiments for the same price and be extremely economically valuable.

**Our second bet is that all frontier compute will be soaked up.** When OpenAI solved Navier-Stokes, they used a private, internal model; not the same GPT you and I have access to through [chatgpt.com](http://chatgpt.com). As models get more intelligent, we see labs having no reason to release them publicly, but rather to use them internally to directly solve the world's hardest problems like Navier-Stokes directly and increase company valuations.

At a certain point, it becomes infinitely more valuable to use compute to recursively improve internal models as every incremental increase in intelligence is so valuable that it makes no sense to use compute in any other way (ie, serving user demand).

While the compute crunch in datacenters will get worse, we still see many chips not in datacenters around the world that are being vastly underutilized. For example the gaming GPUs on your PC sit idle, the older AWS Trainium chips have capacity, and (in the near future) the robots cleaning around your house have powerful AI chips that are already powered on and paid for but aren’t utilized! Recently [Sam Altman talked](https://x.com/RT_on_X/status/2116458055999361152?a=NqW2B9asPa2xzyoMgYU&s=20) about how people owning local RAM is terrible for global utilization and we agree. Somehow, this globally underutilized and underpriced silicon needs to be utilized.

**Slug is building infrastructure that can run on this globally scattered and unconventional compute for a world of throughput.**

Inference has always been built with low latency in mind and forced engineers to use frontier GPUs at low utilization. We’re throwing away everything that is known about inference and rebuilding the entire stack to be optimized for throughput per $.

Rewriting kernels, using overlooked parallelism techniques, doing work offline (sorting requests by experts activated, batching aggressively, speculating for higher throughput, etc), choosing this “unconventional but cheap” spotty, distributed hardware instead of B300 nodes is all a part of our playbook. We’re starting off our quest by proving that we can harness underpriced, underutilized Amazon Inferentia chips to achieve real throughput / $ gains on the pareto frontier.
