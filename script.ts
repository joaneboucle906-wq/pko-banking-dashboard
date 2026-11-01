/**
 * script.ts – Tableau de bord "Banque Aurora" (démonstration fictive)
 * Compilation : npx tsc script.ts --target ES2020 --strict
 */
// ===== Types =====
type TabId = "overview" | "history";
type BlockedAction = "transfer" | "withdraw";
interface Transaction {
  readonly id: number;
  readonly recipient: string; // nom de l'employé
  readonly role: string;      // poste occupé
  readonly date: string;      // format ISO AAAA-MM-JJ
  readonly amount: number;    // montant en PLN (valeur positive)
}
// ===== Données fictives =====
const TOTAL_BALANCE = 70_000_000;
const CURRENCY = "PLN";
const FATHER_NAME = "Tadeusz Nowak";
const PAYMENT_DATE = "2026-10-28";
// 11 derniers salaires, du plus haut poste au plus bas
const TRANSACTIONS: readonly Transaction[] = [
  { id: 1,  recipient: "Jean-Marc Vanderberghe", role: "PDG / CEO",                          date: PAYMENT_DATE, amount: 45000 },
  { id: 2,  recipient: "Mateusz Kowalski",       role: "Directeur Général",                  date: PAYMENT_DATE, amount: 32000 },
  { id: 3,  recipient: "Chantal Dubois",         role: "Directrice des Ressources Humaines", date: PAYMENT_DATE, amount: 24000 },
  { id: 4,  recipient: "Agnieszka Wiśniewska",   role: "Chef Comptable",                     date: PAYMENT_DATE, amount: 21500 },
  { id: 5,  recipient: "Philippe Mertens",       role: "Responsable Logistique",             date: PAYMENT_DATE, amount: 18000 },
  { id: 6,  recipient: "Jan Zieliński",          role: "Superviseur de Production",          date: PAYMENT_DATE, amount: 14500 },
  { id: 7,  recipient: "Annelies Willems",       role: "Assistante Administrative",          date: PAYMENT_DATE, amount: 11000 },
  { id: 8,  recipient: "Jakub Woźniak",          role: "Technicien de Maintenance",          date: PAYMENT_DATE, amount: 9500 },
  { id: 9,  recipient: "Lucas Peeters",          role: "Agent de Sécurité Privé",            date: PAYMENT_DATE, amount: 8200 },
  { id: 10, recipient: "Karolina Kaczmarek",     role: "Préparatrice de Commandes",          date: PAYMENT_DATE, amount: 7800 },
  { id: 11, recipient: "Michel Dumont",          role: "Agent d'Entretien / Nettoyeur",      date: PAYMENT_DATE, amount: 6500 },
];
const BLOCK_MESSAGES: Record<BlockedAction, string> = {
  transfer:
    `Un nouveau virement est impossible : ce compte de succession est gelé tant que les employés de ${FATHER_NAME} n'ont pas été intégralement payés.`,
  withdraw:
    `Le retrait est impossible : ce compte de succession est gelé afin de protéger les salaires et indemnités dus aux employés de ${FATHER_NAME}.`,
};
// ===== Utilitaires =====
/** Récupère un élément du DOM avec un type strict, ou lève une erreur claire. */
function getElement<T extends HTMLElement>(selector: string, type: new () => T): T {
  const el = document.querySelector(selector);
  if (!(el instanceof type)) {
    throw new Error(`Élément introuvable ou de mauvais type : ${selector}`);
  }
  return el;
}
/** Formate un montant en PLN (ex. 45 000 PLN). */
const formatMoney = (value: number): string =>
  `${new Intl.NumberFormat("fr-FR").format(value)} ${CURRENCY}`;
const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(iso));
// ===== Références DOM =====
const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".tab"));
const panels = Array.from(document.querySelectorAll<HTMLElement>(".panel"));
const balanceEl = getElement("#balance", HTMLElement);
const employeesEl = getElement("#stat-employees", HTMLElement);
const totalEl = getElement("#stat-total", HTMLElement);
const txListEl = getElement("#tx-list", HTMLUListElement);
const dialogEl = getElement("#block-dialog", HTMLDialogElement);
const dialogMsgEl = getElement("#dialog-message", HTMLElement);
const dialogCloseBtn = getElement("#dialog-close", HTMLButtonElement);
// ===== Rendu =====
/** Résumé de la vue d'ensemble : solde, nombre d'employés, total des salaires. */
function renderSummary(): void {
  balanceEl.textContent = formatMoney(TOTAL_BALANCE);
  employeesEl.textContent = String(TRANSACTIONS.length);
  totalEl.textContent = formatMoney(
    TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0)
  );
}
/** Injecte les 11 virements dans la liste de l'onglet "Historique". */
function renderTransactions(): void {
  txListEl.replaceChildren(); // vide la liste avant de la remplir
for (const tx of TRANSACTIONS) {
    const li = document.createElement("li");
    li.className = "tx";
  // Colonne gauche : nom + poste + date
    const info = document.createElement("div");
    const name = document.createElement("div");
    name.className = "tx-name";
    name.textContent = `${tx.id}. ${tx.recipient}`; // textContent : pas d'injection HTML
    const meta = document.createElement("div");
    meta.className = "tx-meta";
    meta.textContent = `${tx.role} · Salaire · ${formatDate(tx.date)}`;
    info.append(name, meta);
  // Colonne droite : montant négatif (débit) en PLN
    const amount = document.createElement("div");
    amount.className = "tx-amount";
    amount.textContent = `− ${formatMoney(tx.amount)}`;
 // Statut : salaire versé
    const status = document.createElement("span");
    status.className = "tx-status status-paid";
    status.textContent = "Payé";
  li.append(info, amount, status);
    txListEl.appendChild(li);
  }
}
// ===== Onglets =====
/** Affiche l'onglet demandé et masque les autres (sans rechargement). */
function switchTab(target: TabId): void {
  tabButtons.forEach((btn) => {
    const active = btn.dataset.tab === target;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
    btn.tabIndex = active ? 0 : -1;
  });
  panels.forEach((panel) => {
    const active = panel.dataset.panel === target;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
// Les 11 lignes sont injectées à chaque ouverture de l'onglet Historique
  if (target === "history") {
    renderTransactions();
  }
}
function isTabId(value: string | undefined): value is TabId {
  return value === "overview" || value === "history";
}
// ===== Alertes de blocage =====
function showBlockAlert(action: BlockedAction): void {
  dialogMsgEl.textContent = BLOCK_MESSAGES[action];
  dialogEl.showModal();
}
function isBlockedAction(value: string | undefined): value is BlockedAction {
  return value === "transfer" || value === "withdraw";
}
// ===== Initialisation =====
function init(): void {
  renderSummary();
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.tab;
      if (isTabId(id)) switchTab(id);
    });
  });
 document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (isBlockedAction(action)) showBlockAlert(action);
    });
  });
 dialogCloseBtn.addEventListener("click", () => dialogEl.close());
}
init();
