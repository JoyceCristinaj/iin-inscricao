"use strict";

/**
 * inscricao.js (compatível com localhost)
 * - Envia o formulário inscricao.html para Google Apps Script Web App
 * - Funciona em localhost usando fetch com mode:"no-cors"
 *
 * Observação:
 * - no-cors NÃO permite ler a resposta do servidor,
 *   então consideramos "ok" se o POST foi disparado sem erro.
 */

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzDnYroQADyNc6WFjBfVtfXGuyIrQ5-PLYErZ3E2vuKKcyeZyVzbrkr74BgkzX58r8-Lw/exec";
// ============ Helpers UI (toast) ============
function ensureToast() {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    document.body.appendChild(t);
  }
  return t;
}

function showToast(message, kind = "ok") {
  const t = ensureToast();
  t.className = `toast show ${kind}`;
  t.textContent = message;
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    t.classList.remove("show");
  }, 5000);
}

function setSubmitting(form, isSubmitting) {
  const submitBtn = form.querySelector('button[type="submit"]');
  if (!submitBtn) return;

  if (isSubmitting) {
    submitBtn.dataset._oldText = submitBtn.textContent;
    submitBtn.textContent = "Enviando...";
    submitBtn.disabled = true;
  } else {
    submitBtn.textContent = submitBtn.dataset._oldText || "📩 Enviar inscrição";
    submitBtn.disabled = false;
    delete submitBtn.dataset._oldText;
  }
}

// ============ Serialização ============
function formToObject(form) {
  const fd = new FormData(form);
  const obj = {};

  for (const [k, v] of fd.entries()) {
    if (obj[k] !== undefined) {
      if (!Array.isArray(obj[k])) obj[k] = [obj[k]];
      obj[k].push(v);
    } else {
      obj[k] = v;
    }
  }

  // normalizar arrays (dias e motivo)
  if (!obj.dias) obj.dias = [];
  if (!Array.isArray(obj.dias)) obj.dias = [obj.dias];

  if (!obj.motivo) obj.motivo = [];
  if (!Array.isArray(obj.motivo)) obj.motivo = [obj.motivo];

  // ✅ salvar melhor na planilha: transforma arrays em texto
  obj.dias = obj.dias.filter(Boolean).join(", ");
  obj.motivo = obj.motivo.filter(Boolean).join(", ");

  // ✅ checkboxes: se marcou, vira "sim"; se não, vira "nao"
  // (mesmo que seja required, isso evita inconsistência)
  obj.aceite_imagem = fd.get("aceite_imagem") ? "sim" : "nao";
  obj.aceite_verdade = fd.get("aceite_verdade") ? "sim" : "nao";

  // normalizações úteis
  obj.created_at = new Date().toISOString();
  obj.status = "novo";
  obj.ultimo_contato_em = obj.ultimo_contato_em || "";
  obj.observacao = obj.observacao || "";

  // WhatsApp só números
  if (obj.resp_whatsapp) obj.resp_whatsapp = String(obj.resp_whatsapp).replace(/\D/g, "");
  // CEP só números
  if (obj.cep) obj.cep = String(obj.cep).replace(/\D/g, "");

  // UF maiúsculo (se existir)
  if (obj.uf_emissor) obj.uf_emissor = String(obj.uf_emissor).toUpperCase().slice(0, 2);

  return obj;
}

// ============ Validação ============
function validate(form) {
  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }

  const wInput = form.querySelector("#resp_whatsapp");
  const w = (wInput?.value || "").replace(/\D/g, "");

  if (w.length < 10 || w.length > 13) {
    showToast("Digite um WhatsApp válido do responsável (com DDD).", "warn");
    wInput?.focus();
    return false;
  }

  const alunoNome = (form.querySelector("#aluno_nome")?.value || "").trim();
  if (alunoNome.length < 3) {
    showToast("Informe o nome completo do(a) aluno(a).", "warn");
    form.querySelector("#aluno_nome")?.focus();
    return false;
  }

  const respNome = (form.querySelector("#resp_nome")?.value || "").trim();
  if (respNome.length < 3) {
    showToast("Informe o nome completo do responsável.", "warn");
    form.querySelector("#resp_nome")?.focus();
    return false;
  }

  // ✅ garante que os required checkboxes foram marcados
  const imgOk = form.querySelector("#aceite_imagem");
  const verOk = form.querySelector("#aceite_verdade");
  if (imgOk && !imgOk.checked) {
    showToast("Você precisa autorizar o uso de imagem (obrigatório).", "warn");
    imgOk.focus();
    return false;
  }
  if (verOk && !verOk.checked) {
    showToast("Você precisa declarar que as informações são verdadeiras (obrigatório).", "warn");
    verOk.focus();
    return false;
  }

  return true;
}

// ============ Rede ============
// Envio compatível com localhost (no-cors)
async function apiSend(payload) {
  if (!SCRIPT_URL) throw new Error("SCRIPT_URL não configurada.");

  await fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "create",
      payload,
    }),
  });

  return { ok: true };
}

// Ping diagnóstico (não bloqueia)
async function apiPing() {
  if (!SCRIPT_URL) return false;
  try {
    await fetch(`${SCRIPT_URL}?action=ping`, { method: "GET", mode: "no-cors" });
    return true;
  } catch {
    return false;
  }
}

// ============ Inicialização ============
(function initInscricao() {
  const form = document.getElementById("inscricaoForm");
  if (!form) {
    console.warn("inscricao.js: Formulário #inscricaoForm não encontrado.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validate(form)) return;

    const payload = formToObject(form);

    setSubmitting(form, true);
    try {
      await apiSend(payload);

      showToast("Inscrição enviada com sucesso! ✅ Em breve entraremos em contato no WhatsApp.", "ok");

      form.reset();
      window.scrollTo({ top: 0, behavior: "smooth" });

      console.log("POST disparado (no-cors). Confira a planilha para confirmar gravação.");
      console.log("Payload enviado:", payload);
    } catch (err) {
      console.error(err);
      const msg = String(err?.message || err || "");

      if (msg.toLowerCase().includes("script_url")) {
        showToast("Configuração pendente: falta colar a URL do Apps Script no inscricao.js.", "warn");
      } else if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network")) {
        showToast("Não foi possível enviar agora. Verifique internet e tente novamente.", "warn");
      } else {
        showToast(`Não foi possível enviar agora. ${msg ? "Motivo: " + msg : ""}`, "bad");
      }
    } finally {
      setSubmitting(form, false);
    }
  });

  apiPing().then(() => {});
})();