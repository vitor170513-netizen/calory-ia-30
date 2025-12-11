
export const getFriendlyErrorMessage = (error: any): string => {
  if (!error) return "Ocorreu um erro desconhecido.";
  
  if (typeof error === 'string') return error;

  let extractedMsg = error.message || error.error_description || error.msg || error.code;

  if (typeof extractedMsg === 'object' && extractedMsg !== null) {
      try {
          extractedMsg = JSON.stringify(extractedMsg);
      } catch (e) {
          extractedMsg = "";
      }
  }

  if (!extractedMsg) {
      try {
          const stringified = JSON.stringify(error);
          if (stringified === '{}' || stringified === '[]') {
              return "Erro de Conexão: O servidor recusou a chave fornecida ou a URL está inacessível. Verifique suas credenciais.";
          }
          extractedMsg = stringified;
      } catch (e) {
          return "Erro interno de conexão.";
      }
  }

  let finalMsg = String(extractedMsg).toLowerCase();

  if (finalMsg.includes('[object object]')) {
      return "Falha na Autenticação. Erro técnico não detalhado pelo servidor.";
  }

  if (finalMsg.includes('invalid login credentials')) return "E-mail ou senha incorretos.";
  if (finalMsg.includes('user already registered')) return "Este e-mail já está cadastrado. Tente fazer login.";
  if (finalMsg.includes('password should be at least')) return "A senha deve ter pelo menos 6 caracteres.";
  if (finalMsg.includes('email not confirmed')) return "Verifique seu e-mail para confirmar a conta.";
  if (finalMsg.includes('rate limit')) return "Muitas tentativas. Aguarde um pouco.";
  if (finalMsg.includes('api key')) return "Chave de API inválida (Formato incorreto).";
  
  if (finalMsg.includes('row-level security') || finalMsg.includes('policy')) {
      return "Permissão negada. Erro na política de segurança do banco de dados.";
  }
  
  if (finalMsg.includes('network') || finalMsg.includes('fetch') || finalMsg.includes('failed to fetch')) {
      return "Erro de Rede: Não foi possível conectar ao Supabase. Verifique a URL.";
  }

  return finalMsg || "Erro desconhecido. Tente novamente.";
};
