/* =========================================================
   PAYFLOW PRO
   Complete Corrected JavaScript
   ========================================================= */


/* =========================================================
   SUPABASE CONFIGURATION
   ========================================================= */

/*
  IMPORTANT:
  Replace these with your own Supabase project details.

  Get them from:
  Supabase Dashboard
  → Project Settings
  → API

  Use:
  - Project URL
  - Publishable key / anon key

  NEVER put the service_role / secret key here.
*/

const SUPABASE_URL = "https://zhivpgaqtfknvckupmdh.supabase.co";
const SUPABASE_KEY = "sb_publishable_YOndHkKaFkGDsnT9W5j-mw_FS7PKzrN";


/* =========================================================
   SUPABASE CLIENT
   ========================================================= */

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;
let profile = null;
let wallet = null;
let transactions = [];
let authMode = "signin";
let toastTimer = null;


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

const toast = $("toast");
const sidebar = $("sidebar");
const pageTitle = $("pageTitle");
const pageSubtitle = $("pageSubtitle");


/* =========================================================
   APP VISIBILITY
   ========================================================= */

function showApp() {

  const app = $("app");

  if (!app) return;

  app.classList.remove("logged-out");
  app.classList.add("logged-in");

}


function hideApp() {

  const app = $("app");

  if (!app) return;

  app.classList.remove("logged-in");
  app.classList.add("logged-out");

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "normal") {

  if (!toast) return;

  clearTimeout(toastTimer);

  toast.textContent = message;

  toast.className = "toast show";

  if (type === "success") {
    toast.classList.add("success");
  }

  if (type === "error") {
    toast.classList.add("error");
  }

  toastTimer = setTimeout(() => {

    toast.className = "toast";

  }, 3500);

}


/* =========================================================
   MONEY FORMAT
   ========================================================= */

function formatMoney(amount) {

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(Number(amount || 0));

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(date) {

  if (!date) return "";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   AUTH MODAL
   ========================================================= */

function openAuthModal() {

  const modal = $("authModal");

  if (!modal) return;

  modal.classList.remove("hidden");

}


function closeAuthModal() {

  /*
    VERY IMPORTANT:
    A logged-out user cannot close the authentication
    modal and expose the dashboard.
  */

  if (!currentUser) {

    openAuthModal();

    return;

  }

  const modal = $("authModal");

  if (!modal) return;

  modal.classList.add("hidden");

}


function setAuthMode(mode) {

  authMode = mode;

  if (mode === "signin") {

    $("authTitle").textContent =
      "Welcome to PayFlow";

    $("authSubtitle").textContent =
      "Sign in to access your wallet";

    $("authSubmit").textContent =
      "Sign In";

    $("authToggle").textContent =
      "Don't have an account? Create one";

  } else {

    $("authTitle").textContent =
      "Create your PayFlow account";

    $("authSubtitle").textContent =
      "Create an account to start using PayFlow";

    $("authSubmit").textContent =
      "Create Account";

    $("authToggle").textContent =
      "Already have an account? Sign In";

  }

}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

async function handleAuth(event) {

  event.preventDefault();

  const email =
    $("authEmail").value.trim();

  const password =
    $("authPassword").value;


  if (!email || !password) {

    showToast(
      "Enter email and password",
      "error"
    );

    return;

  }


  if (password.length < 6) {

    showToast(
      "Password must contain at least 6 characters",
      "error"
    );

    return;

  }


  $("authSubmit").disabled = true;


  try {

    if (authMode === "signin") {

      const {
        data,
        error
      } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });


      if (error) {
        throw error;
      }


      if (!data.user) {

        throw new Error(
          "Could not sign in. Please try again."
        );

      }


      currentUser = data.user;

      showApp();

      closeAuthModal();

      showToast(
        "Signed in successfully",
        "success"
      );

      await loadApp();

    } else {

      const {
        data,
        error
      } =
        await supabaseClient.auth.signUp({

          email,

          password,

          options: {
            data: {
              full_name:
                email
                  .split("@")[0]
            }
          }

        });


      if (error) {
        throw error;
      }


      /*
        If email confirmation is disabled,
        Supabase gives us a session immediately.
      */

      if (data.session && data.user) {

        currentUser = data.user;

        showApp();

        closeAuthModal();

        showToast(
          "Account created successfully",
          "success"
        );

        await loadApp();

      } else {

        /*
          If email confirmation is enabled,
          the user must verify their email.
        */

        showToast(
          "Account created. Check your email to confirm your account.",
          "success"
        );

        setAuthMode("signin");

      }

    }

  } catch (error) {

    console.error("Authentication error:", error);

    showToast(
      error.message || "Authentication failed",
      "error"
    );

  } finally {

    $("authSubmit").disabled = false;

  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

  try {

    await supabaseClient.auth.signOut();

  } catch (error) {

    console.error("Logout error:", error);

  }


  currentUser = null;
  profile = null;
  wallet = null;
  transactions = [];


  hideApp();

  openAuthModal();

  setAuthMode("signin");

  showToast(
    "Signed out successfully",
    "success"
  );

}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile() {

  if (!currentUser) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();


  if (error) {

    console.error(
      "Profile loading error:",
      error
    );

    showToast(
      "Could not load profile",
      "error"
    );

    return;

  }


  profile = data;


  /*
    Normally your database trigger creates
    the profile automatically.

    This is only a fallback.
  */

  if (!profile) {

    const name =
      currentUser.user_metadata?.full_name ||
      currentUser.email?.split("@")[0] ||
      "User";


    const cleanName =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");


    const generatedUpi =
      `${cleanName || "user"}@ybl`;


    const {
      data: createdProfile,
      error: createError
    } =
      await supabaseClient
        .from("profiles")
        .insert({

          id: currentUser.id,

          full_name: name,

          email: currentUser.email,

          upi_id: generatedUpi

        })
        .select()
        .single();


    if (createError) {

      console.error(
        "Profile creation error:",
        createError
      );

    } else {

      profile = createdProfile;

    }

  }


  updateProfileUI();

}


/* =========================================================
   LOAD WALLET
   ========================================================= */

async function loadWallet() {

  if (!currentUser) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("wallets")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();


  if (error) {

    console.error(
      "Wallet loading error:",
      error
    );

    showToast(
      "Could not load wallet",
      "error"
    );

    return;

  }


  wallet = data;

  updateBalanceUI();

}


/* =========================================================
   LOAD TRANSACTIONS
   ========================================================= */

async function loadTransactions() {

  if (!currentUser) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("transactions")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", {
        ascending: false
      })
      .limit(100);


  if (error) {

    console.error(
      "Transaction loading error:",
      error
    );

    transactions = [];

    renderTransactions();
    renderStats();
    renderChart();

    return;

  }


  transactions = data || [];


  renderTransactions();

  renderStats();

  renderChart();

}


/* =========================================================
   PROFILE UI
   ========================================================= */

function updateProfileUI() {

  if (!profile) return;


  const name =
    profile.full_name ||
    currentUser?.email?.split("@")[0] ||
    "User";


  if ($("topName")) {

    $("topName").textContent =
      name;

  }


  if ($("topAvatar")) {

    $("topAvatar").textContent =
      name
        .charAt(0)
        .toUpperCase();

  }


  if ($("upiDisplay")) {

    $("upiDisplay").textContent =
      profile.upi_id ||
      "Not available";

  }

}


/* =========================================================
   BALANCE UI
   ========================================================= */

function updateBalanceUI() {

  const amount =
    Number(wallet?.balance || 0);


  if ($("balance")) {

    $("balance").textContent =
      formatMoney(amount);

  }

}


/* =========================================================
   PAGE INFORMATION
   ========================================================= */

const pageInfo = {

  dashboard: {
    title: "Dashboard",
    subtitle:
      "Welcome back to PayFlow Pro"
  },

  transactions: {
    title: "Transactions",
    subtitle:
      "View your complete payment history"
  },

  send: {
    title: "Send Money",
    subtitle:
      "Transfer money using UPI"
  },

  recharge: {
    title: "Mobile Recharge",
    subtitle:
      "Recharge your mobile instantly"
  },

  bills: {
    title: "Pay Bills",
    subtitle:
      "Pay your bills securely"
  }

};


/* =========================================================
   NAVIGATION
   ========================================================= */

function showPage(page) {

  if (!currentUser) {

    openAuthModal();

    return;

  }


  document
    .querySelectorAll("[data-page-content]")
    .forEach(section => {

      section.classList.toggle(
        "active",
        section.dataset.pageContent === page
      );

    });


  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });


  const info =
    pageInfo[page] ||
    pageInfo.dashboard;


  if (pageTitle) {

    pageTitle.textContent =
      info.title;

  }


  if (pageSubtitle) {

    pageSubtitle.textContent =
      info.subtitle;

  }


  closeMobileMenu();

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function openMobileMenu() {

  if (!sidebar) return;

  sidebar.classList.add("open");


  const overlay =
    document.querySelector(".mobile-overlay");


  if (overlay) {

    overlay.classList.add("active");

  }

}


function closeMobileMenu() {

  if (sidebar) {

    sidebar.classList.remove("open");

  }


  const overlay =
    document.querySelector(".mobile-overlay");


  if (overlay) {

    overlay.classList.remove("active");

  }

}


/* =========================================================
   TRANSACTION ICON
   ========================================================= */

function transactionIcon(transaction) {

  if (transaction.type === "recharge") {
    return "◉";
  }

  if (transaction.type === "bill") {
    return "▣";
  }

  if (transaction.type === "merchant") {
    return "🛍";
  }

  return "₹";

}


/* =========================================================
   TRANSACTION HTML
   ========================================================= */

function transactionHTML(transaction) {

  const status =
    transaction.status ||
    "success";


  const amount =
    Number(transaction.amount || 0);


  const receiver =
    transaction.receiver_upi ||
    transaction.counterparty ||
    "Payment";


  const description =
    transaction.description ||
    "Payment";


  return `

    <div class="transaction-item">

      <div class="transaction-icon">
        ${transactionIcon(transaction)}
      </div>

      <div class="transaction-info">

        <strong>
          ${escapeHTML(receiver)}
        </strong>

        <small>
          ${escapeHTML(description)}
          •
          ${formatDate(transaction.created_at)}
        </small>

      </div>

      <div class="transaction-amount">

        <strong>
          -${formatMoney(amount)}
        </strong>

        <span
          class="transaction-status ${escapeHTML(status)}"
        >
          ${escapeHTML(status)}
        </span>

      </div>

    </div>

  `;

}


/* =========================================================
   RECENT TRANSACTIONS
   ========================================================= */

function renderRecentTransactions() {

  const container =
    $("recentTransactions");


  if (!container) return;


  const recent =
    transactions.slice(0, 5);


  if (!recent.length) {

    container.innerHTML = `

      <div class="empty-state">
        No transactions yet.
      </div>

    `;

    return;

  }


  container.innerHTML =
    recent
      .map(transactionHTML)
      .join("");

}


/* =========================================================
   ALL TRANSACTIONS
   ========================================================= */

function renderAllTransactions() {

  const container =
    $("allTransactions");


  if (!container) return;


  const search =
    $("searchInput")?.value
      .trim()
      .toLowerCase() ||
    "";


  const status =
    $("statusFilter")?.value ||
    "all";


  const type =
    $("typeFilter")?.value ||
    "all";


  const filtered =
    transactions.filter(transaction => {


      const text = [

        transaction.counterparty,

        transaction.receiver_upi,

        transaction.description,

        transaction.type

      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


      const matchesSearch =
        !search ||
        text.includes(search);


      const matchesStatus =
        status === "all" ||
        transaction.status === status;


      const matchesType =
        type === "all" ||
        transaction.type === type;


      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );

    });


  if (!filtered.length) {

    container.innerHTML = `

      <div class="empty-state">
        No matching transactions found.
      </div>

    `;

    return;

  }


  container.innerHTML =
    filtered
      .map(transactionHTML)
      .join("");

}


/* =========================================================
   RENDER TRANSACTIONS
   ========================================================= */

function renderTransactions() {

  renderRecentTransactions();

  renderAllTransactions();

}


/* =========================================================
   STATISTICS
   ========================================================= */

function renderStats() {

  const successful =
    transactions.filter(
      transaction =>
        transaction.status === "success"
    );


  const pending =
    transactions.filter(
      transaction =>
        transaction.status === "pending"
    );


  const failed =
    transactions.filter(
      transaction =>
        transaction.status === "failed"
    );


  const totalSent =
    successful.reduce(
      (sum, transaction) =>
        sum +
        Number(transaction.amount || 0),
      0
    );


  if ($("totalSent")) {

    $("totalSent").textContent =
      formatMoney(totalSent);

  }


  if ($("successfulCount")) {

    $("successfulCount").textContent =
      successful.length;

  }


  if ($("pendingCount")) {

    $("pendingCount").textContent =
      pending.length;

  }


  if ($("failedCount")) {

    $("failedCount").textContent =
      failed.length;

  }

}


/* =========================================================
   CHART
   ========================================================= */

function renderChart() {

  const container =
    $("chartBars");


  if (!container) return;


  if (!transactions.length) {

    container.innerHTML = `

      <div class="chart-empty">
        No payment data yet
      </div>

    `;

    return;

  }


  const now =
    new Date();


  const values = [];


  for (let i = 6; i >= 0; i--) {

    const date =
      new Date(now);


    date.setDate(
      now.getDate() - i
    );


    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");


    const day =
      String(
        date.getDate()
      ).padStart(2, "0");


    const dateString =
      `${year}-${month}-${day}`;


    const total =
      transactions
        .filter(transaction => {

          if (!transaction.created_at) {
            return false;
          }


          return transaction.created_at
            .slice(0, 10) ===
            dateString;

        })
        .reduce(
          (sum, transaction) =>
            sum +
            Number(transaction.amount || 0),
          0
        );


    values.push({
      date,
      total
    });

  }


  const max =
    Math.max(
      ...values.map(
        item => item.total
      ),
      1
    );


  container.innerHTML =
    values
      .map(item => {

        const height =
          Math.max(
            5,
            (item.total / max) * 85
          );


        const label =
          item.date.toLocaleDateString(
            "en-IN",
            {
              weekday: "short"
            }
          );


        return `

          <div
            class="chart-bar-wrap"
            style="
              height:100%;
              display:flex;
              flex-direction:column;
              justify-content:flex-end;
              align-items:center;
              gap:6px;
              flex:1;
            "
          >

            <div
              class="chart-bar"
              style="height:${height}%"
              title="${formatMoney(item.total)}"
            ></div>

            <small
              style="
                font-size:9px;
                color:#6b7b73;
              "
            >
              ${label}
            </small>

          </div>

        `;

      })
      .join("");

}


/* =========================================================
   SEND MONEY
   ========================================================= */

async function sendMoney(event) {

  event.preventDefault();


  if (!currentUser) {

    openAuthModal();

    return;

  }


  const receiverUpi =
    $("receiverUpi")
      .value
      .trim();


  const amount =
    Number(
      $("sendAmount").value
    );


  const description =
    $("sendDescription")
      .value
      .trim() ||
    "UPI Transfer";


  if (!receiverUpi) {

    showToast(
      "Enter receiver UPI ID",
      "error"
    );

    return;

  }


  if (!receiverUpi.includes("@")) {

    showToast(
      "Enter a valid UPI ID",
      "error"
    );

    return;

  }


  if (!amount || amount <= 0) {

    showToast(
      "Enter a valid amount",
      "error"
    );

    return;

  }


  const button =
    event.submitter ||
    $("sendForm")
      .querySelector("button[type='submit']");


  if (button) {
    button.disabled = true;
  }


  try {

    /*
      These parameter names match your
      existing Supabase SQL functions:

      send_money(
        receiver_upi,
        send_amount,
        send_description
      )
    */

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "send_money",
        {
          receiver_upi:
            receiverUpi,

          send_amount:
            amount,

          send_description:
            description
        }
      );


    if (error) {
      throw error;
    }


    console.log(
      "send_money result:",
      data
    );


    $("sendForm").reset();


    if ($("sendDescription")) {

      $("sendDescription").value =
        "UPI Transfer";

    }


    showToast(
      `Payment of ${formatMoney(amount)} successful`,
      "success"
    );


    await loadWallet();

    await loadTransactions();


  } catch (error) {

    console.error(
      "Send money error:",
      error
    );


    showToast(
      error.message ||
      "Payment failed",
      "error"
    );

  } finally {

    if (button) {
      button.disabled = false;
    }

  }

}


/* =========================================================
   MOBILE RECHARGE
   ========================================================= */

async function rechargeMobile(event) {

  event.preventDefault();


  if (!currentUser) {

    openAuthModal();

    return;

  }


  const mobile =
    $("mobileNumber")
      .value
      .trim();


  const operator =
    $("operator")
      .value;


  const amount =
    Number(
      $("rechargeAmount")
        .value
    );


  if (!/^[0-9]{10}$/.test(mobile)) {

    showToast(
      "Enter a valid 10 digit mobile number",
      "error"
    );

    return;

  }


  if (!operator) {

    showToast(
      "Select an operator",
      "error"
    );

    return;

  }


  if (!amount || amount <= 0) {

    showToast(
      "Enter recharge amount",
      "error"
    );

    return;

  }


  const button =
    event.submitter ||
    $("rechargeForm")
      .querySelector("button[type='submit']");


  if (button) {
    button.disabled = true;
  }


  try {

    /*
      Matches your existing SQL:

      recharge_mobile(
        mobile_number,
        mobile_operator,
        recharge_amount
      )
    */

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "recharge_mobile",
        {
          mobile_number:
            mobile,

          mobile_operator:
            operator,

          recharge_amount:
            amount
        }
      );


    if (error) {
      throw error;
    }


    console.log(
      "recharge_mobile result:",
      data
    );


    $("rechargeForm").reset();


    showToast(
      `Recharge of ${formatMoney(amount)} successful`,
      "success"
    );


    await loadWallet();

    await loadTransactions();


  } catch (error) {

    console.error(
      "Recharge error:",
      error
    );


    showToast(
      error.message ||
      "Recharge failed",
      "error"
    );

  } finally {

    if (button) {
      button.disabled = false;
    }

  }

}


/* =========================================================
   BILL PAYMENT
   ========================================================= */

async function payBill(event) {

  event.preventDefault();


  if (!currentUser) {

    openAuthModal();

    return;

  }


  const billType =
    $("billType")
      .value;


  const accountNumber =
    $("billAccount")
      .value
      .trim();


  const amount =
    Number(
      $("billAmount")
        .value
    );


  if (!billType) {

    showToast(
      "Select a bill type",
      "error"
    );

    return;

  }


  if (!accountNumber) {

    showToast(
      "Enter account number",
      "error"
    );

    return;

  }


  if (!amount || amount <= 0) {

    showToast(
      "Enter a valid amount",
      "error"
    );

    return;

  }


  const button =
    event.submitter ||
    $("billForm")
      .querySelector("button[type='submit']");


  if (button) {
    button.disabled = true;
  }


  try {

    /*
      Matches your existing SQL:

      pay_bill(
        payment_bill_type,
        payment_account_number,
        payment_amount
      )
    */

    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "pay_bill",
        {
          payment_bill_type:
            billType,

          payment_account_number:
            accountNumber,

          payment_amount:
            amount
        }
      );


    if (error) {
      throw error;
    }


    console.log(
      "pay_bill result:",
      data
    );


    $("billForm").reset();


    $("billFormWrap")
      .classList.add("hidden");


    showToast(
      `${billType} bill paid successfully`,
      "success"
    );


    await loadWallet();

    await loadTransactions();


  } catch (error) {

    console.error(
      "Bill payment error:",
      error
    );


    showToast(
      error.message ||
      "Bill payment failed",
      "error"
    );

  } finally {

    if (button) {
      button.disabled = false;
    }

  }

}


/* =========================================================
   BILL SELECTION
   ========================================================= */

function selectBill(type) {

  if (!currentUser) {

    openAuthModal();

    return;

  }


  $("billType").value =
    type;


  $("billTitle").textContent =
    `Pay ${type} Bill`;


  $("billFormWrap")
    .classList.remove("hidden");


  $("billFormWrap")
    .scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

}


/* =========================================================
   LOAD COMPLETE APP
   ========================================================= */

async function loadApp() {

  if (!currentUser) {

    hideApp();

    openAuthModal();

    return;

  }


  showApp();


  /*
    Load separately so one failure
    doesn't prevent everything else.
  */

  try {

    await loadProfile();

  } catch (error) {

    console.error(
      "Profile load failed:",
      error
    );

  }


  try {

    await loadWallet();

  } catch (error) {

    console.error(
      "Wallet load failed:",
      error
    );

  }


  try {

    await loadTransactions();

  } catch (error) {

    console.error(
      "Transactions load failed:",
      error
    );

  }

}


/* =========================================================
   INITIAL SESSION
   ========================================================= */

async function initialize() {

  /*
    Always hide the dashboard first.

    This prevents profile information from
    appearing before authentication is checked.
  */

  hideApp();


  try {

    const {
      data: {
        session
      }
    } =
      await supabaseClient.auth.getSession();


    if (session?.user) {

      currentUser =
        session.user;


      showApp();

      closeAuthModal();

      await loadApp();


    } else {

      currentUser = null;

      profile = null;

      wallet = null;

      transactions = [];

      hideApp();

      openAuthModal();

    }


  } catch (error) {

    console.error(
      "Session initialization error:",
      error
    );


    currentUser = null;

    hideApp();

    openAuthModal();


    showToast(
      "Please sign in to continue",
      "error"
    );

  }

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */


/* Navigation */

document
  .querySelectorAll(".nav-item")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showPage(
          button.dataset.page
        );

      }
    );

  });


/* View All */

document
  .querySelectorAll("[data-page-target]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showPage(
          button.dataset.pageTarget
        );

      }
    );

  });


/* Mobile menu */

const mobileMenuButton =
  document.querySelector(".menu-button");


if (mobileMenuButton) {

  mobileMenuButton.addEventListener(
    "click",
    () => {

      if (!currentUser) {

        openAuthModal();

        return;

      }


      if (
        sidebar.classList.contains("open")
      ) {

        closeMobileMenu();

      } else {

        openMobileMenu();

      }

    }
  );

}


/* Mobile overlay */

const mobileOverlay =
  document.querySelector(".mobile-overlay");


if (mobileOverlay) {

  mobileOverlay.addEventListener(
    "click",
    closeMobileMenu
  );

}


/* Refresh */

if ($("refreshBtn")) {

  $("refreshBtn")
    .addEventListener(
      "click",
      async () => {

        if (!currentUser) {

          openAuthModal();

          return;

        }


        showToast(
          "Refreshing..."
        );


        await loadApp();


        showToast(
          "Data refreshed",
          "success"
        );

      }
    );

}


/* Logout */

if ($("logoutBtn")) {

  $("logoutBtn")
    .addEventListener(
      "click",
      logout
    );

}


/* Authentication form */

if ($("authForm")) {

  $("authForm")
    .addEventListener(
      "submit",
      handleAuth
    );

}


/* Auth mode toggle */

if ($("authToggle")) {

  $("authToggle")
    .addEventListener(
      "click",
      () => {

        setAuthMode(
          authMode === "signin"
            ? "signup"
            : "signin"
        );

      }
    );

}


/*
  IMPORTANT:
  X cannot expose the dashboard when logged out.
*/

if ($("closeAuth")) {

  $("closeAuth")
    .addEventListener(
      "click",
      () => {

        if (!currentUser) {

          showToast(
            "Please sign in to continue",
            "error"
          );

          openAuthModal();

          return;

        }


        closeAuthModal();

      }
    );

}


/* Send money */

if ($("sendForm")) {

  $("sendForm")
    .addEventListener(
      "submit",
      sendMoney
    );

}


/* Recharge */

if ($("rechargeForm")) {

  $("rechargeForm")
    .addEventListener(
      "submit",
      rechargeMobile
    );

}


/* Quick recharge amounts */

document
  .querySelectorAll("[data-recharge-amount]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        if ($("rechargeAmount")) {

          $("rechargeAmount").value =
            button.dataset.rechargeAmount;

        }

      }
    );

  });


/* Bill payment */

if ($("billForm")) {

  $("billForm")
    .addEventListener(
      "submit",
      payBill
    );

}


/* Bill cards */

document
  .querySelectorAll(".bill-card")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        selectBill(
          button.dataset.bill
        );

      }
    );

  });


/* Transaction search */

if ($("searchInput")) {

  $("searchInput")
    .addEventListener(
      "input",
      renderAllTransactions
    );

}


/* Status filter */

if ($("statusFilter")) {

  $("statusFilter")
    .addEventListener(
      "change",
      renderAllTransactions
    );

}


/* Type filter */

if ($("typeFilter")) {

  $("typeFilter")
    .addEventListener(
      "change",
      renderAllTransactions
    );

}


/* =========================================================
   SUPABASE AUTH STATE
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    /*
      Do not perform heavy Supabase queries
      directly inside this callback.
    */

    setTimeout(async () => {

      if (
        event === "SIGNED_IN" &&
        session?.user
      ) {

        currentUser =
          session.user;


        showApp();

        closeAuthModal();


        await loadApp();

      }


      if (
        event === "SIGNED_OUT"
      ) {

        currentUser = null;

        profile = null;

        wallet = null;

        transactions = [];


        hideApp();

        openAuthModal();

      }

    }, 0);

  }
);


/* =========================================================
   START APPLICATION
   ========================================================= */

setAuthMode("signin");

hideApp();

initialize();
