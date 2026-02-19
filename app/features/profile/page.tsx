"use client"
import React, { useState } from "react"
import { createERPUser } from "./create-user-action"

const page = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = await createERPUser(email, password)
      console.log("User created:", user)
      alert("User created successfully!")
    } catch (err: any) {
      console.error(err)
      alert("Error: " + err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Register a User</button>
    </form>
  )
}

export default page
