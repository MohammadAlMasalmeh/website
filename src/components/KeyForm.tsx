import { useState, type FormEvent } from 'react';

const VOLUMES = ['Under 5M', '5M to 50M', '50M to 500M', 'More than 500M'];

// No backend yet, so this opens a prefilled email instead of posting anywhere.
export default function KeyForm({ email }: { email: string }) {
  const [opened, setOpened] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = [
      `Email: ${data.get('email')}`,
      `Volume: ${data.get('volume')}`,
      '',
      'What I am running:',
      data.get('use'),
    ].join('\n');
    const subject = 'Slug AI API key request';
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  return (
    <form className="key-form" onSubmit={handleSubmit}>
      <label>
        Email
        <input type="email" name="email" required autoComplete="email" placeholder="you@company.com" />
      </label>
      <label>
        What are you running through it?
        <textarea name="use" required placeholder="Classifying support tickets, tagging product listings, ..." />
      </label>
      <label>
        Tokens a month, roughly
        <select name="volume">
          {VOLUMES.map((volume) => (
            <option key={volume}>{volume}</option>
          ))}
        </select>
      </label>
      <button className="button" type="submit">
        Request a key
      </button>
      <p className="muted" role="status" style={{ margin: 0 }}>
        {opened
          ? `Your email app should have opened. If it didn't, write to ${email}.`
          : `This opens an email to ${email} with what you typed.`}
      </p>
    </form>
  );
}
