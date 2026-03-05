"use strict";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzDnYroQADyNc6WFjBfVtfXGuyIrQ5-PLYErZ3E2vuKKcyeZyVzbrkr74BgkzX58r8-Lw/exec";

const NUCLEOS_AULAS = {
  "Núcleo 1 - Jacarezinho": {
    modalidades: {
      "Muay Thai": {
        dias: ["Segunda", "Quarta"],
        horarios: {
          Segunda: [
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
            "20:00 às 21:00",
          ],
          Quarta: [
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
            "20:00 às 21:00",
          ],
        },
      },
    },
  },

  "Núcleo 2 - Jacarezinho": {
    modalidades: {
      "Jiu-Jitsu": {
        dias: ["Terça", "Quinta"],
        horarios: {
          Terça: [
            "09:00 às 10:00",
            "10:00 às 11:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
          ],
          Quinta: [
            "09:00 às 10:00",
            "10:00 às 11:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
          ],
        },
      },
    },
  },

  "Núcleo 3 - Penha": {
    modalidades: {
      "Jiu-Jitsu": {
        dias: ["Terça", "Quinta"],
        horarios: {
          Terça: [
            "10:00 às 11:00",
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "20:00 às 21:00",
          ],
          Quinta: [
            "10:00 às 11:00",
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "20:00 às 21:00",
          ],
        },
      },
    },
  },

  "Núcleo 4 - Santa Cruz": {
    modalidades: {
      Boxe: {
        dias: ["Terça", "Quinta"],
        horarios: {
          Terça: [
            "09:00 às 10:00",
            "10:00 às 11:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
          ],
          Quinta: [
            "09:00 às 10:00",
            "10:00 às 11:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
            "18:00 às 19:00",
            "19:00 às 20:00",
          ],
        },
      },
    },
  },

  "Núcleo 5 - Campo Grande": {
    modalidades: {
      "Jiu-Jitsu": {
        dias: ["Terça", "Quinta"],
        horarios: {
          Terça: [
            "09:00 às 10:00",
            "14:00 às 15:00",
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
          ],
          Quinta: [
            "09:00 às 10:00",
            "14:00 às 15:00",
            "15:00 às 16:00",
            "16:00 às 17:00",
            "17:00 às 18:00",
          ],
        },
      },
    },
  },

  "Núcleo 6 - Freguesia": {
    modalidades: {
      "Muay Thai": {
        dias: ["Terça", "Quinta"],
        horariosBase: ["09:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
      },
    },
  },

  "Núcleo 7 - Realengo": {
    modalidades: {
      Boxe: {
        dias: ["Segunda", "Quarta"],
        horariosBase: ["09:00", "10:00", "15:00", "16:00", "17:00", "18:00"],
      },
    },
  },
};

let triedSubmit = false;

function addOneHour(hhmm) {
  const parts = String(hhmm).split(":");
  const hh = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return "";

  const total = (hh * 60 + mm + 60) % (24 * 60);
  const nh = String(Math.floor(total / 60)).padStart(2, "0");
  const nm = String(total % 60).padStart(2, "0");
  return `${nh}:${nm}`;
}

function toRangeText(start) {
  const end = addOneHour(start);
  return end ? `${start} às ${end}` : start;
}

function setSelectOptions(selectEl, placeholder, options) {
  selectEl.innerHTML = "";

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholder;
  opt0.selected = true;
  selectEl.appendChild(opt0);

  (options || []).forEach((val) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    selectEl.appendChild(opt);
  });
}

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
  showToast._timer = window.setTimeout(() => t.classList.remove("show"), 4200);
}

function getSubmitBtn(form) {
  return document.getElementById("btnEnviar") || form.querySelector('button[type="submit"]');
}

/* IMPORTANTE:
   - NÃO desabilita o botão por validade.
   - Só desabilita quando estiver "Enviando..."
*/
function updateSubmitAvailability(form) {
  const btn = getSubmitBtn(form);
  if (!btn) return;

  const isSending = btn.textContent.trim().toLowerCase() === "enviando...";
  btn.disabled = isSending;
}

function setSubmitting(form, isSubmitting) {
  const submitBtn = getSubmitBtn(form);
  if (!submitBtn) return;

  if (isSubmitting) {
    submitBtn.dataset._oldText = submitBtn.textContent;
    submitBtn.textContent = "Enviando...";
    submitBtn.disabled = true;
  } else {
    submitBtn.textContent = submitBtn.dataset._oldText || "📩 Enviar inscrição";
    delete submitBtn.dataset._oldText;
    updateSubmitAvailability(form);
  }
}

function escapeAttrValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function getLabelText(el) {
  const id = el && el.id ? el.id : "";
  if (!id) return "";
  const safe = escapeAttrValue(id);
  const label = document.querySelector(`label[for="${safe}"]`);
  return (label && label.textContent ? label.textContent : "").replace("*", "").trim();
}

function ensureInlineErrorAfter(el) {
  const next = el && el.nextElementSibling ? el.nextElementSibling : null;
  if (next && next.classList && next.classList.contains("error-msg")) return next;

  const msg = document.createElement("div");
  msg.className = "error-msg";
  msg.style.display = "block";
  msg.style.marginTop = "4px";
  msg.style.fontSize = "12px";
  msg.style.color = "rgba(255,77,77,.95)";
  el.insertAdjacentElement("afterend", msg);
  return msg;
}

function clearFieldErrors(form) {
  form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
  form.querySelectorAll(".field.has-error").forEach((wrap) => wrap.classList.remove("has-error"));

  form.querySelectorAll(".error-msg").forEach((m) => {
    m.textContent = "";
    m.style.display = "none";
  });
}

function markInvalidFields(form) {
  clearFieldErrors(form);

  const invalids = Array.from(form.querySelectorAll(":invalid")).filter((el) => !el.disabled);

  invalids.forEach((el) => {
    el.classList.add("is-invalid");

    const fieldWrap = el.closest(".field");
    if (fieldWrap) fieldWrap.classList.add("has-error");

    let msgEl = null;
    if (fieldWrap) {
      msgEl = fieldWrap.querySelector(".error-msg");
      if (!msgEl) {
        msgEl = document.createElement("div");
        msgEl.className = "error-msg";
        fieldWrap.appendChild(msgEl);
      }
    } else {
      msgEl = ensureInlineErrorAfter(el);
    }

    const label = getLabelText(el);
    const text = el.validationMessage || "Preencha este campo.";
    msgEl.textContent = label ? `${label}: ${text}` : text;
    msgEl.style.display = "block";
    msgEl.style.marginTop = "4px";
    msgEl.style.fontSize = "12px";
    msgEl.style.color = "rgba(255,77,77,.95)";
  });

  if (invalids.length) invalids[0].focus();
}

function countMissingRequired(form) {
  return Array.from(form.querySelectorAll(":invalid")).filter((el) => !el.disabled).length;
}

function preencherNucleoModalidadeDiaHorario() {
  const form = document.getElementById("inscricaoForm");
  if (!form) return;

  const nucleoEl = document.getElementById("nucleo");
  const modalidadeEl = document.getElementById("modalidade");
  const diaEl = document.getElementById("dia");
  const horarioEl = document.getElementById("horario");
  if (!nucleoEl || !modalidadeEl || !diaEl || !horarioEl) return;

  setSelectOptions(nucleoEl, "Selecione", Object.keys(NUCLEOS_AULAS));

  modalidadeEl.disabled = true;
  diaEl.disabled = true;
  horarioEl.disabled = true;

  setSelectOptions(modalidadeEl, "Selecione o núcleo primeiro", []);
  setSelectOptions(diaEl, "Selecione a modalidade primeiro", []);
  setSelectOptions(horarioEl, "Selecione o dia primeiro", []);

  function getNucleoData() {
    return NUCLEOS_AULAS[nucleoEl.value] || null;
  }

  function getModData() {
    const n = getNucleoData();
    if (!n) return null;
    return (n.modalidades || {})[modalidadeEl.value] || null;
  }

  function resetFromModalidade() {
    diaEl.disabled = true;
    horarioEl.disabled = true;
    diaEl.value = "";
    horarioEl.value = "";
    setSelectOptions(diaEl, "Selecione a modalidade primeiro", []);
    setSelectOptions(horarioEl, "Selecione o dia primeiro", []);
  }

  function resetFromDia() {
    horarioEl.disabled = true;
    horarioEl.value = "";
    setSelectOptions(horarioEl, "Selecione o dia primeiro", []);
  }

  nucleoEl.addEventListener("change", () => {
    resetFromModalidade();

    modalidadeEl.disabled = true;
    modalidadeEl.value = "";
    setSelectOptions(modalidadeEl, "Selecione", []);

    const n = getNucleoData();
    if (!n) {
      setSelectOptions(modalidadeEl, "Selecione o núcleo primeiro", []);
      updateSubmitAvailability(form);
      return;
    }

    const mods = Object.keys(n.modalidades || {});
    setSelectOptions(modalidadeEl, "Selecione", mods);
    modalidadeEl.disabled = false;

    if (mods.length === 1) {
      modalidadeEl.value = mods[0];
      modalidadeEl.dispatchEvent(new Event("change"));
    }

    updateSubmitAvailability(form);
  });

  modalidadeEl.addEventListener("change", () => {
    resetFromDia();

    const modData = getModData();
    if (!modData) {
      resetFromModalidade();
      updateSubmitAvailability(form);
      return;
    }

    setSelectOptions(diaEl, "Selecione", modData.dias || []);
    diaEl.disabled = false;

    updateSubmitAvailability(form);
  });

  diaEl.addEventListener("change", () => {
    const modData = getModData();
    resetFromDia();

    if (!modData || !diaEl.value) {
      updateSubmitAvailability(form);
      return;
    }

    let horarios = [];
    if (modData.horarios && modData.horarios[diaEl.value]) {
      horarios = modData.horarios[diaEl.value];
    } else if (modData.horariosBase) {
      horarios = modData.horariosBase.map(toRangeText);
    }

    setSelectOptions(
      horarioEl,
      horarios.length ? "Selecione um horário" : "Sem horários disponíveis",
      horarios
    );
    horarioEl.disabled = horarios.length === 0;

    updateSubmitAvailability(form);
  });

  horarioEl.addEventListener("change", () => updateSubmitAvailability(form));

  updateSubmitAvailability(form);
}

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

  if (!obj.motivo) obj.motivo = [];
  if (!Array.isArray(obj.motivo)) obj.motivo = [obj.motivo];
  obj.motivo = obj.motivo.filter(Boolean).join(", ");

  obj.aceite_imagem = fd.get("aceite_imagem") ? "sim" : "nao";
  obj.aceite_verdade = fd.get("aceite_verdade") ? "sim" : "nao";

  obj.created_at = new Date().toISOString();
  obj.status = "novo";
  obj.ultimo_contato_em = obj.ultimo_contato_em || "";
  obj.observacao = obj.observacao || "";

  if (obj.resp_whatsapp) obj.resp_whatsapp = String(obj.resp_whatsapp).replace(/\D/g, "");
  if (obj.cep) obj.cep = String(obj.cep).replace(/\D/g, "");
  if (obj.uf_emissor) obj.uf_emissor = String(obj.uf_emissor).toUpperCase().slice(0, 2);

  return obj;
}

function validate(form) {
  if (!form.checkValidity()) {
    const missing = countMissingRequired(form);
    showToast(`Faltam ${missing} campo(s) obrigatório(s).`, "warn");
    form.reportValidity();
    return false;
  }

  const wInput = form.querySelector("#resp_whatsapp");
  const w = (wInput && wInput.value ? wInput.value : "").replace(/\D/g, "");
  if (w.length < 10 || w.length > 13) {
    showToast("Digite um WhatsApp válido do responsável (com DDD).", "warn");
    if (wInput) wInput.focus();
    return false;
  }

  return true;
}

async function apiSend(payload) {
  if (!SCRIPT_URL) throw new Error("SCRIPT_URL não configurada.");

  await fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "create", payload }),
  });

  return { ok: true };
}

async function apiPing() {
  if (!SCRIPT_URL) return false;
  try {
    await fetch(`${SCRIPT_URL}?action=ping`, { method: "GET", mode: "no-cors" });
    return true;
  } catch {
    return false;
  }
}

(function initInscricao() {
  const form = document.getElementById("inscricaoForm");
  if (!form) return;

  preencherNucleoModalidadeDiaHorario();
  updateSubmitAvailability(form);

  form.addEventListener("input", () => {
    updateSubmitAvailability(form);
    if (triedSubmit) markInvalidFields(form);
  });

  form.addEventListener("change", () => {
    updateSubmitAvailability(form);
    if (triedSubmit) markInvalidFields(form);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    triedSubmit = true;

    if (!validate(form)) {
      markInvalidFields(form);
      updateSubmitAvailability(form);
      return;
    }

    clearFieldErrors(form);
    const payload = formToObject(form);

    setSubmitting(form, true);
    try {
      await apiSend(payload);
      showToast("Inscrição enviada com sucesso! ✅ Em breve entraremos em contato no WhatsApp.", "ok");
      form.reset();
      triedSubmit = false;
      clearFieldErrors(form);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg = String(err?.message || err || "");
      const lower = msg.toLowerCase();

      if (lower.includes("script_url")) {
        showToast("Configuração pendente: URL do Apps Script não encontrada.", "warn");
      } else if (lower.includes("failed to fetch") || lower.includes("network")) {
        showToast("Não foi possível enviar agora. Verifique internet e tente novamente.", "warn");
      } else {
        showToast(`Não foi possível enviar agora. ${msg ? "Motivo: " + msg : ""}`, "bad");
      }
    } finally {
      setSubmitting(form, false);
      updateSubmitAvailability(form);
    }
  });

  apiPing().then(() => {});
})();
