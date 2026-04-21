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
  users: {
    management: {
      title: "Gestão de utilizadores",
      description: "Como admin, pode criar, editar e apagar utilizadores. A password nunca é mostrada, apenas definida ou alterada.",
      create: {
        submit: "Criar utilizador",
        submitting: "A criar...",
        success: "Utilizador criado com sucesso.",
        error: "Não foi possível criar o utilizador.",
        fields: {
          name: "Nome",
          email: "Email",
          role: "Role",
          picturePath: "Foto (URL/caminho)",
          picturePlaceholder: "Opcional",
          password: "Password",
        },
        validation: "Dados inválidos para criar utilizador.",
      },
      edit: {
        submit: "Guardar alterações",
        submitting: "A guardar...",
        success: "Utilizador atualizado com sucesso.",
        error: "Não foi possível atualizar o utilizador.",
        noChanges: "Sem alterações para guardar.",
        fields: {
          name: "Nome",
          email: "Email",
          role: "Role",
          picturePath: "Foto (URL/caminho)",
          picturePlaceholder: "Opcional",
          password: "Nova password",
          passwordPlaceholder: "Deixe vazio para manter",
        },
        validation: "Dados inválidos para atualizar utilizador.",
      },
      delete: {
        submit: "Apagar",
        submitting: "A apagar...",
        confirmation: "Tem a certeza que quer apagar {name}?",
        success: "Utilizador apagado com sucesso.",
        error: "Não foi possível apagar o utilizador.",
      },
      table: {
        headers: {
          name: "Nome",
          email: "Email",
          role: "Role",
          picture: "Foto",
          actions: "Ações",
        },
        emptyPicture: "-",
      },
      editing: "Editar: {name}",
      cannotDeleteSelf: "Não pode apagar a sua própria conta.",
      roles: {
        viewer: "Viewer",
        editor: "Editor",
        admin: "Admin",
      },
    },
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
