'use client'

import { useState } from 'react'

const Test = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent page reload

    try {
      const res = await fetch('/api/src/modules/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) throw new Error('Failed to save client');

      const data = await res.json();
      setName('');
      setEmail('');
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <form onSubmit={submit}>
        <input
          type="text"
          className="border"
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          className="border"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  )
}

export default Test;
