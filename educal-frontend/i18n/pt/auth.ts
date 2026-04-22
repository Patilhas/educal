export const auth = {
  login: {
    fields: {
      email: "Email",
        password: "Password",
    },
    staySignedIn: "Manter sessão iniciada",
      submit: "Entrar",
      submitting: "A entrar...",
      errors: {
      loginFailed: "Não foi possível autenticar.",
        requestFailed: "Erro ao fazer login.",
        invalidEmail: "Email inválido",
        invalidPassword: "A password deve ter pelo menos 8 caracteres",
    },
  },
  logout: {
    errors: {
      requestFailed: "Não foi possível terminar sessão.",
    },
  },
}