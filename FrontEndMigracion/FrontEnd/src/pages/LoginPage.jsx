import React from 'react'
import { LoginForm } from '../components/ui/LoginForm'
import { FondoLogin } from '../components/ui/FondoLogin'

export const LoginPage = () => {
  return (
    <>
    <div className="login-page">
    <FondoLogin />
    <LoginForm />
    </div>
    </>
  )
}
