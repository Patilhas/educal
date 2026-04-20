export const common = {
  auth: {
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
  },
  actions: {
    add: "Adicionar",
    edit: "Editar",
    save: "Guardar",
    saveChanges: "Guardar alterações",
    cancel: "Cancelar",
    delete: "Eliminar",
    remove: "Remover",
    confirm: "Confirmar",
    close: "Fechar",
    logout: "Terminar sessão",
  },
  status: {
    success: "Sucesso",
    error: "Erro",
    loading: "A carregar...",
  },
  errors: {
    generic: "Ocorreu um erro inesperado.",
    network: "Falha ao comunicar com o servidor.",
    format: "Erro ao formatar",
  },
  api: {
    errors: {
      endpointNotFound: "Endpoint não encontrado",
      backendCommunicationFailed: "Falha ao comunicar com o backend",
      invalidServerResponse: "Resposta inválida do servidor",
    },
  },
};
