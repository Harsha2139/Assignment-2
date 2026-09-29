/* =========================================================
   PAYFLOW PRO — JAVASCRIPT
   Supabase + Demo Mode
   ========================================================= */

// =========================================================
// 1. SUPABASE CONFIGURATION
// =========================================================

const SUPABASE_URL = "https://zhivpgaqtfknvckupmdh.supabase.co";
const SUPABASE_KEY = "sb_publishable_YOndHkKaFkGDsnT9W5j-mw_FS7PKzrN";

const hasSupabaseConfig =
    window.supabase &&
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("YOUR_") &&
    !SUPABASE_KEY.includes("YOUR_");

const db = hasSupabaseConfig
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        }
    )
    : null;


// =========================================================
// 2. DEMO DATA
// =========================================================

const demoProfile = {
    id: "demo",
    full_name: "Harsha Reddy",
    email: "harsha@ybl",
    upi_id: "harsha@ybl"
};

let currentUser = null;

let profile = {
    ...demoProfile
};

let walletBalance = 67000;

let transactions = [
    {
        id: "demo-1",
        name: "Rahul Sharma",
        type: "upi",
        description: "UPI Transfer",
        amount: 500,
        status: "success",
        created_at: "2026-09-29T10:30:00"
    },
    {
        id: "demo-2",
        name: "FreshMart Supermarket",
        type: "upi",
        description: "Merchant Payment",
        amount: 850,
        status: "success",
        created_at: "2026-09-29T09:15:00"
    },
    {
        id: "demo-3",
        name: "Priya Reddy",
        type: "upi",
        description: "UPI Transfer",
        amount: 1200,
        status: "pending",
        created_at: "2026-09-28T18:45:00"
    },
    {
        id: "demo-4",
        name: "Metro Electronics",
        type: "upi",
        description: "Merchant Payment",
        amount: 5600,
        status: "success",
        created_at: "2026-09-28T15:20:00"
    },
    {
        id: "demo-5",
        name: "Electricity Bill",
        type: "bill",
        description: "TANGEDCO",
        amount: 1250,
        status: "failed",
        created_at: "2026-09-28T12:00:00"
    }
];


// =========================================================
// 3. SHORTCUT
// =========================================================

const $ = id => document.getElementById(id);


// =========================================================
// 4. MONEY FORMAT
// =========================================================

function money(value) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(value || 0));

}


// =========================================================
// 5. TOAST MESSAGE
// =========================================================

function showMessage(message) {

    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(window.__toastTimer);

    window.__toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2600);

}


// =========================================================
// 6. DATE FORMAT
// =========================================================

function formatDate(value) {

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Recently";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}


// =========================================================
// 7. HTML SECURITY
// =========================================================

function escapeHtml(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char])
    );

}


// =========================================================
// 8. INITIALS
// =========================================================

function initials(name) {

    return String(name || "H")
        .split(" ")
        .map(x => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

}


// =========================================================
// 9. BALANCE
// =========================================================

function setBalance(value) {

    walletBalance = Number(value || 0);

    if ($("balanceAmount")) {
        $("balanceAmount").textContent = money(walletBalance);
    }

    if ($("paymentBalance")) {
        $("paymentBalance").textContent = money(walletBalance);
    }

}


// =========================================================
// 10. PROFILE
// =========================================================

function renderProfile() {

    if ($("profileName")) {
        $("profileName").textContent =
            profile.full_name || "PayFlow User";
    }

    if ($("profileEmail")) {
        $("profileEmail").textContent =
            profile.upi_id ||
            profile.email ||
            "user@ybl";
    }

    if ($("profileAvatar")) {
        $("profileAvatar").textContent =
            initials(profile.full_name);
    }

}


// =========================================================
// 11. DASHBOARD STATS
// =========================================================

function renderStats() {

    const sent = transactions
        .filter(t =>
            ["upi", "recharge", "bill"].includes(t.type) &&
            t.status === "success"
        )
        .reduce(
            (sum, t) =>
                sum + Number(t.amount || 0),
            0
        );

    if ($("totalSent")) {
        $("totalSent").textContent = money(sent);
    }

    if ($("successCount")) {
        $("successCount").textContent =
            transactions.filter(
                t => t.status === "success"
            ).length;
    }

    if ($("pendingCount")) {
        $("pendingCount").textContent =
            transactions.filter(
                t => t.status === "pending"
            ).length;
    }

    if ($("failedCount")) {
        $("failedCount").textContent =
            transactions.filter(
                t => t.status === "failed"
            ).length;
    }

}


// =========================================================
// 12. TRANSACTION HTML
// =========================================================

function transactionHtml(t) {

    const name =
        t.name ||
        t.counterparty ||
        t.description ||
        "Payment";

    const typeLabel =
        t.type === "recharge"
            ? "Mobile Recharge"
            : t.type === "bill"
                ? "Bill Payment"
                : "UPI Transfer";

    const icon = initials(name);

    const iconClass =
        t.status === "failed"
            ? "green-bg"
            : t.type === "recharge"
                ? "green-bg"
                : "blue-bg";

    return `
        <div class="transaction">

            <div class="transaction-icon ${iconClass}">
                ${escapeHtml(icon)}
            </div>

            <div class="transaction-info">

                <strong>
                    ${escapeHtml(name)}
                </strong>

                <small>
                    ${escapeHtml(typeLabel)}
                    •
                    ${escapeHtml(formatDate(t.created_at))}
                </small>

            </div>

            <div class="transaction-amount">

                <strong>
                    - ${money(t.amount)}
                </strong>

                <small class="${escapeHtml(t.status)}">
                    ${escapeHtml(
                        t.status.charAt(0).toUpperCase() +
                        t.status.slice(1)
                    )}
                </small>

            </div>

        </div>
    `;

}


// =========================================================
// 13. RENDER TRANSACTIONS
// =========================================================

function renderTransactions(list = transactions) {

    const html = list.length
        ? list.map(transactionHtml).join("")
        : `
            <div class="empty-state">
                No transactions match your filters.
            </div>
        `;

    if ($("dashboardTransactions")) {

        $("dashboardTransactions").innerHTML =
            list
                .slice(0, 5)
                .map(transactionHtml)
                .join("") ||
            `
                <div class="empty-state">
                    No transactions yet.
                </div>
            `;
    }

    if ($("transactionList")) {
        $("transactionList").innerHTML = html;
    }

    renderStats();

    renderChart();

}


// =========================================================
// 14. CHART
// =========================================================

function renderChart() {

    if (!$("miniChart")) return;

    const months = [
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep"
    ];

    const values = [
        38,
        54,
        42,
        70,
        58,
        82
    ];

    $("miniChart").innerHTML =
        values
            .map(
                (value, index) => `
                    <div
                        class="bar"
                        style="height:${value}%"
                    >
                        <span>
                            ${months[index]}
                        </span>
                    </div>
                `
            )
            .join("");

}


// =========================================================
// 15. FILTERS
// =========================================================

function applyFilters() {

    const search =
        ($("searchInput")?.value || "")
            .trim()
            .toLowerCase();

    const status =
        $("statusFilter")?.value || "all";

    const type =
        $("typeFilter")?.value || "all";

    const filtered =
        transactions.filter(t => {

            const text =
                `${t.name || ""}
                 ${t.description || ""}
                 ${t.counterparty || ""}`
                    .toLowerCase();

            return (
                (!search || text.includes(search)) &&
                (status === "all" ||
                    t.status === status) &&
                (type === "all" ||
                    t.type === type)
            );

        });

    renderTransactions(filtered);

}


// =========================================================
// 16. PAGE NAVIGATION
// =========================================================

function openView(viewId) {

    document
        .querySelectorAll(".view")
        .forEach(view =>
            view.classList.remove("active-view")
        );

    const view = $(viewId);

    if (!view) return;

    view.classList.add("active-view");

    document
        .querySelectorAll(
            ".nav-item[data-view]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.view === viewId
            );

        });

    const labels = {

        dashboardView:
            "Dashboard",

        transactionsView:
            "Transactions",

        paymentsView:
            "Send Money",

        rechargeView:
            "Mobile Recharge",

        billsView:
            "Pay Bills"

    };

    if ($("pageTitle")) {

        $("pageTitle").textContent =
            labels[viewId] || "Dashboard";

    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if ($("sidebar")) {
        $("sidebar").classList.remove("open");
    }

}


// =========================================================
// 17. LOAD PROFILE FROM SUPABASE
// =========================================================

async function loadProfile() {

    if (!db || !currentUser) {

        profile = {
            ...demoProfile
        };

        renderProfile();

        return;
    }

    const {
        data,
        error
    } = await db
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

    if (error) {

        console.error(error);

        showMessage(
            "Could not load profile"
        );

        return;
    }

    if (data) {
        profile = data;
    }

    renderProfile();

}


// =========================================================
// 18. LOAD WALLET
// =========================================================

async function loadWallet() {

    if (!db || !currentUser) {

        setBalance(67000);

        return;
    }

    const {
        data,
        error
    } = await db
        .from("wallets")
        .select("balance,account_label")
        .eq("user_id", currentUser.id)
        .maybeSingle();

    if (error) {

        console.error(error);

        showMessage(
            "Could not load wallet"
        );

        return;
    }

    if (data) {

        setBalance(data.balance);

        if ($("accountLabel")) {

            $("accountLabel").textContent =
                data.account_label ||
                "Linked account";
        }

    }

}


// =========================================================
// 19. LOAD TRANSACTIONS FROM SUPABASE
// =========================================================

async function loadTransactions() {

    if (!db || !currentUser) {

        renderTransactions();

        return;
    }

    const {
        data,
        error
    } = await db
        .from("transactions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(100);

    if (error) {

        console.error(error);

        showMessage(
            "Could not load transactions"
        );

        return;
    }

    transactions =
        (data || []).map(t => ({

            ...t,

            name:
                t.counterparty ||
                t.description ||
                t.type

        }));

    renderTransactions();

}


// =========================================================
// 20. REFRESH APPLICATION
// =========================================================

async function refreshApp() {

    if (!db || !currentUser) {

        if ($("syncLabel")) {

            $("syncLabel").textContent =
                "Demo data · Supabase not configured";

        }

        renderProfile();

        setBalance(67000);

        renderTransactions();

        return;
    }

    if ($("syncLabel")) {

        $("syncLabel").textContent =
            "Syncing securely…";

    }

    await Promise.all([
        loadProfile(),
        loadWallet(),
        loadTransactions()
    ]);

    if ($("syncLabel")) {

        $("syncLabel").textContent =
            "Synced with Supabase";

    }

}


// =========================================================
// 21. SEND MONEY
// =========================================================

async function sendMoney(event) {

    event.preventDefault();

    const upi =
        $("upiInput").value.trim();

    const amount =
        Number(
            $("amountInput").value
        );

    const description =
        $("descriptionInput").value.trim() ||
        "UPI Transfer";

    if (!upi.includes("@")) {

        showMessage(
            "Enter a valid UPI ID"
        );

        return;
    }

    if (!amount || amount <= 0) {

        showMessage(
            "Enter a valid amount"
        );

        return;
    }

    if (amount > walletBalance) {

        showMessage(
            "Insufficient wallet balance"
        );

        return;
    }

    const btn = $("payBtn");

    btn.disabled = true;

    btn.textContent =
        "Processing…";

    try {

        // -----------------------------
        // DEMO MODE
        // -----------------------------

        if (!db || !currentUser) {

            walletBalance -= amount;

            transactions.unshift({

                id: crypto.randomUUID(),

                name: upi,

                counterparty: upi,

                description,

                type: "upi",

                amount,

                status: "success",

                created_at:
                    new Date().toISOString()

            });

            setBalance(walletBalance);

            renderTransactions();

            $("paymentForm").reset();

            showMessage(
                `Demo payment of ${money(amount)} sent to ${upi}`
            );

            return;
        }


        // -----------------------------
        // SUPABASE RPC
        // -----------------------------

        const {
            data,
            error
        } = await db.rpc(
            "send_money",
            {
                p_receiver_upi: upi,
                p_amount: amount,
                p_description: description
            }
        );

        if (error) {
            throw error;
        }

        if (data?.new_balance !== undefined) {

            setBalance(
                data.new_balance
            );

        }

        $("paymentForm").reset();

        await refreshApp();

        showMessage(
            `Payment of ${money(amount)} recorded successfully`
        );

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Payment failed"
        );

    } finally {

        btn.disabled = false;

        btn.textContent =
            "Pay Securely";

    }

}


// =========================================================
// 22. MOBILE RECHARGE
// =========================================================

async function recharge(event) {

    event.preventDefault();

    const mobile =
        $("mobileInput").value.trim();

    const operator =
        $("operatorInput").value;

    const amount =
        Number(
            $("rechargeAmountInput").value
        );

    if (!/^[0-9]{10}$/.test(mobile)) {

        showMessage(
            "Enter a valid 10-digit mobile number"
        );

        return;
    }

    if (!operator) {

        showMessage(
            "Select an operator"
        );

        return;
    }

    if (!amount || amount <= 0) {

        showMessage(
            "Enter a valid recharge amount"
        );

        return;
    }

    if (amount > walletBalance) {

        showMessage(
            "Insufficient wallet balance"
        );

        return;
    }

    const btn =
        $("rechargeBtn");

    btn.disabled = true;

    btn.textContent =
        "Processing…";

    try {

        // DEMO

        if (!db || !currentUser) {

            walletBalance -= amount;

            transactions.unshift({

                id: crypto.randomUUID(),

                name:
                    `${operator} • ${mobile}`,

                description:
                    "Mobile Recharge",

                type:
                    "recharge",

                amount,

                status:
                    "success",

                created_at:
                    new Date().toISOString()

            });

            setBalance(walletBalance);

            renderTransactions();

            $("rechargeForm").reset();

            showMessage(
                `Demo recharge of ${money(amount)} submitted`
            );

            return;
        }


        // SUPABASE

        const {
            error
        } = await db.rpc(
            "recharge_mobile",
            {
                p_mobile: mobile,
                p_operator: operator,
                p_amount: amount
            }
        );

        if (error) {
            throw error;
        }

        $("rechargeForm").reset();

        await refreshApp();

        showMessage(
            `Recharge of ${money(amount)} recorded`
        );

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Recharge failed"
        );

    } finally {

        btn.disabled = false;

        btn.textContent =
            "Recharge Now";

    }

}


// =========================================================
// 23. OPEN BILL FORM
// =========================================================

function openBillForm(type) {

    $("billTypeInput").value =
        type;

    $("billFormCard")
        .classList
        .remove("hidden");

    $("billFormCard")
        .scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

}


// =========================================================
// 24. PAY BILL
// =========================================================

async function payBill(event) {

    event.preventDefault();

    const type =
        $("billTypeInput").value;

    const account =
        $("consumerInput").value.trim();

    const amount =
        Number(
            $("billAmountInput").value
        );

    if (!type || !account) {

        showMessage(
            "Enter bill account details"
        );

        return;
    }

    if (!amount || amount <= 0) {

        showMessage(
            "Enter a valid bill amount"
        );

        return;
    }

    if (amount > walletBalance) {

        showMessage(
            "Insufficient wallet balance"
        );

        return;
    }

    try {

        // DEMO

        if (!db || !currentUser) {

            walletBalance -= amount;

            transactions.unshift({

                id: crypto.randomUUID(),

                name:
                    `${type} Bill`,

                description:
                    `Bill Payment • ${account}`,

                type:
                    "bill",

                amount,

                status:
                    "success",

                created_at:
                    new Date().toISOString()

            });

            setBalance(walletBalance);

            renderTransactions();

            $("billForm").reset();

            $("billFormCard")
                .classList
                .add("hidden");

            showMessage(
                `${type} bill of ${money(amount)} recorded`
            );

            return;
        }


        // SUPABASE

        const {
            error
        } = await db.rpc(
            "pay_bill",
            {
                p_bill_type: type,
                p_account_number: account,
                p_amount: amount
            }
        );

        if (error) {
            throw error;
        }

        $("billForm").reset();

        $("billFormCard")
            .classList
            .add("hidden");

        await refreshApp();

        showMessage(
            `${type} bill payment recorded`
        );

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Bill payment failed"
        );

    }

}


// =========================================================
// 25. NAVIGATION EVENTS
// =========================================================

function setupNavigation() {

    document
        .querySelectorAll("[data-open]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openView(
                        button.dataset.open
                    )
            );

        });


    document
        .querySelectorAll(
            ".nav-item[data-view]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openView(
                        button.dataset.view
                    )
            );

        });


    if ($("menuBtn")) {

        $("menuBtn")
            .addEventListener(
                "click",
                () =>
                    $("sidebar")
                        .classList
                        .toggle("open")
            );

    }


    if ($("refreshBtn")) {

        $("refreshBtn")
            .addEventListener(
                "click",
                refreshApp
            );

    }


    if ($("scanBtn")) {

        $("scanBtn")
            .addEventListener(
                "click",
                () =>
                    showMessage(
                        "Scan & Pay UI can be connected to a QR scanner next."
                    )
            );

    }


    if ($("profileBtn")) {

        $("profileBtn")
            .addEventListener(
                "click",
                () =>
                    showMessage(
                        `${profile.full_name || "Profile"} account`
                    )
            );

    }


    if ($("searchInput")) {

        $("searchInput")
            .addEventListener(
                "input",
                applyFilters
            );

    }


    if ($("statusFilter")) {

        $("statusFilter")
            .addEventListener(
                "change",
                applyFilters
            );

    }


    if ($("typeFilter")) {

        $("typeFilter")
            .addEventListener(
                "change",
                applyFilters
            );

    }


    document
        .querySelectorAll(".bill-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () =>
                    openBillForm(
                        card.dataset.bill
                    )
            );

        });

}


// =========================================================
// 26. AUTH MODAL
// =========================================================

function openAuth(mode = "login") {

    $("authModal")
        .classList
        .remove("hidden");

    $("authTitle").textContent =
        mode === "login"
            ? "Sign in"
            : "Create account";

    $("authSubtitle").textContent =
        mode === "login"
            ? "Use your Supabase account to sync your wallet and transactions."
            : "Create a Supabase account for your private PayFlow data.";

    $("authSubmit").textContent =
        mode === "login"
            ? "Sign in"
            : "Create account";

    $("authNameLabel")
        .classList
        .toggle(
            "hidden",
            mode === "login"
        );

    $("authModeBtn").textContent =
        mode === "login"
            ? "Create a new account"
            : "I already have an account";

    $("authForm").dataset.mode =
        mode;

}


// =========================================================
// 27. AUTHENTICATION
// =========================================================

async function submitAuth(event) {

    event.preventDefault();

    if (!db) {

        showMessage(
            "Supabase is not configured — demo mode is active."
        );

        $("authModal")
            .classList
            .add("hidden");

        return;
    }

    const email =
        $("authEmail")
            .value
            .trim();

    const password =
        $("authPassword")
            .value;

    const mode =
        $("authForm")
            .dataset
            .mode;

    const name =
        $("authName")
            .value
            .trim();

    $("authSubmit")
        .disabled = true;

    try {

        if (mode === "login") {

            const {
                error
            } = await db.auth
                .signInWithPassword({
                    email,
                    password
                });

            if (error) {
                throw error;
            }

            $("authModal")
                .classList
                .add("hidden");

            showMessage(
                "Signed in successfully"
            );

        } else {

            const {
                data,
                error
            } = await db.auth
                .signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name:
                                name ||
                                "PayFlow User"
                        }
                    }
                });

            if (error) {
                throw error;
            }

            if (data.session) {

                $("authModal")
                    .classList
                    .add("hidden");

                showMessage(
                    "Account created"
                );

            } else {

                showMessage(
                    "Account created. Check your email to confirm it."
                );

            }

        }

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Authentication failed"
        );

    } finally {

        $("authSubmit")
            .disabled = false;

    }

}


// =========================================================
// 28. SIGN OUT
// =========================================================

async function signOut() {

    if (!db || !currentUser) {

        showMessage(
            "Demo mode signed out"
        );

        return;
    }

    const {
        error
    } = await db.auth.signOut();

    if (error) {

        showMessage(
            error.message
        );

        return;
    }

    currentUser = null;

    showMessage(
        "Signed out"
    );

    setTimeout(
        () => location.reload(),
        500
    );

}


// =========================================================
// 29. SUPABASE AUTH INITIALIZATION
// =========================================================

async function initAuth() {

    if (!db) {

        if ($("syncLabel")) {

            $("syncLabel").textContent =
                "Demo data · add Supabase keys for cloud database";

        }

        return;
    }

    const {
        data
    } = await db.auth.getSession();

    currentUser =
        data.session?.user ||
        null;

    if (!currentUser) {

        openAuth("login");

    } else {

        await refreshApp();

    }


    db.auth.onAuthStateChange(
        async (_event, session) => {

            currentUser =
                session?.user ||
                null;

            if (currentUser) {

                $("authModal")
                    .classList
                    .add("hidden");

                await refreshApp();

            }

        }
    );

}


// =========================================================
// 30. PAGE START
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupNavigation();


        // PAYMENT FORM

        if ($("paymentForm")) {

            $("paymentForm")
                .addEventListener(
                    "submit",
                    sendMoney
                );

        }


        // RECHARGE FORM

        if ($("rechargeForm")) {

            $("rechargeForm")
                .addEventListener(
                    "submit",
                    recharge
                );

        }


        // BILL FORM

        if ($("billForm")) {

            $("billForm")
                .addEventListener(
                    "submit",
                    payBill
                );

        }


        // SIGN OUT

        if ($("signOutBtn")) {

            $("signOutBtn")
                .addEventListener(
                    "click",
                    signOut
                );

        }


        // AUTH CLOSE

        if ($("authClose")) {

            $("authClose")
                .addEventListener(
                    "click",
                    () =>
                        $("authModal")
                            .classList
                            .add("hidden")
                );

        }


        // AUTH MODE

        if ($("authModeBtn")) {

            $("authModeBtn")
                .addEventListener(
                    "click",
                    () => {

                        const current =
                            $("authForm")
                                .dataset
                                .mode ||
                            "login";

                        openAuth(
                            current === "login"
                                ? "signup"
                                : "login"
                        );

                    }
                );

        }


        // AUTH SUBMIT

        if ($("authForm")) {

            $("authForm")
                .addEventListener(
                    "submit",
                    submitAuth
                );

        }


        // INITIAL RENDER

        renderProfile();

        setBalance(
            walletBalance
        );

        renderTransactions();

        renderChart();


        // START SUPABASE

        await initAuth();

    }
);
