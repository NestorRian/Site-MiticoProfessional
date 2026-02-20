const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const cartToggleBtn = document.getElementById("cart-toggle");
const cartPanel = document.getElementById("cart-panel");
const cartCloseBtn = document.getElementById("cart-close");

if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener("click", function () {
        mobileMenu.classList.toggle("hidden");
    });

    mobileMenu.addEventListener("click", function (event) {
        if (event.target.tagName === "A") {
            mobileMenu.classList.add("hidden");
        }
    });
}

function openCartPanel() {
    if (cartPanel) {
        cartPanel.classList.add("active");
        cartOpenedAt = Date.now();
    }
}

function closeCartPanel() {
    if (cartPanel) {
        cartPanel.classList.remove("active");
    }
}

if (cartToggleBtn) {
    cartToggleBtn.addEventListener("click", openCartPanel);
}

if (cartCloseBtn) {
    cartCloseBtn.addEventListener("click", closeCartPanel);
}

if (cartPanel) {
    cartPanel.addEventListener("click", function (event) {
        if (event.target === cartPanel) {
            closeCartPanel();
        }
    });
}

const heroTitle = document.getElementById("hero-title");

function prefersReducedMotion() {
    return (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
}

function typeLine(element, text, speed) {
    return new Promise(function (resolve) {
        if (!element) {
            resolve();
            return;
        }

        const content = text || "";
        if (!content.length) {
            element.textContent = "";
            resolve();
            return;
        }

        let index = 0;

        const step = function () {
            index += 1;
            element.textContent = content.slice(0, index);
            if (index < content.length) {
                window.setTimeout(step, speed);
            } else {
                resolve();
            }
        };

        step();
    });
}

function runHeroTyping() {
    if (!heroTitle) {
        return;
    }

    const lines = heroTitle.querySelectorAll("[data-text]");
    if (!lines.length) {
        return;
    }

    if (prefersReducedMotion()) {
        lines.forEach(function (line) {
            line.textContent = line.dataset.text || line.textContent || "";
            line.classList.remove("is-typing");
            line.classList.add("is-typed");
        });
        return;
    }

    const typingSpeed = 42;
    const linePause = 280;

    const run = async function () {
        for (let index = 0; index < lines.length; index += 1) {
            const line = lines[index];
            const text = line.dataset.text || line.textContent || "";
            line.textContent = "";
            line.classList.add("is-typing");
            await typeLine(line, text, typingSpeed);

            const isLast = index === lines.length - 1;
            if (isLast) {
                await new Promise(function (resolve) {
                    window.setTimeout(resolve, 700);
                });
            } else {
                await new Promise(function (resolve) {
                    window.setTimeout(resolve, linePause);
                });
            }
            line.classList.remove("is-typing");
            line.classList.add("is-typed");
        }
    };

    run();
}

runHeroTyping();

const cart = [];
const cartItemsList = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartCountBadge = document.getElementById("cart-count");
const cartTotalMini = document.getElementById("cart-total-mini");
const cartNotification = document.getElementById("cartNotification");
const searchBar = document.getElementById("searchBar");
const cartCepInput = document.getElementById("cart-customer-cep");
const cartStreetInput = document.getElementById("cart-customer-street");
const cartNumberInput = document.getElementById("cart-customer-number");
const cartNeighborhoodInput = document.getElementById("cart-customer-neighborhood");
const cartCityInput = document.getElementById("cart-customer-city");
let cartOpenedAt = 0;
const PRODUCT_CATEGORIES = [
    "Progressivas",
    "Botox",
    "Selagem",
    "Tratamento",
    "Kits Capilares",
    "Shampoo",
    "Cronograma",
    "Cauterizacao",
    "Hidratacao",
    "Finalizadores",
    "Reparadores",
    "Produtos Masculinos",
];
const PAGE_SIZE = 20;
const IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;
const IMAGE_MAX_DIMENSION = 1600;
const IMAGE_MIN_RATIO = 0.7;
const IMAGE_MAX_RATIO = 1.4;
const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
let currentCategory = "Todos";
let currentPage = 1;
const productImageIndexes = {};
const productModal = document.getElementById("product-modal");
const productModalClose = document.getElementById("product-modal-close");
const productModalImage = document.getElementById("product-modal-image");
const productModalThumbs = document.getElementById("product-modal-thumbs");
const productModalTitle = document.getElementById("product-modal-title");
const productModalDescription = document.getElementById("product-modal-description");
const productModalPrice = document.getElementById("product-modal-price");
const productModalPriceOriginal = document.getElementById("product-modal-price-original");
const productModalDiscount = document.getElementById("product-modal-discount");
const productModalCategory = document.getElementById("product-modal-category");
const productModalStock = document.getElementById("product-modal-stock");
const productModalAdd = document.getElementById("product-modal-add");
const productModalWhatsapp = document.getElementById("product-modal-whatsapp");
const analyticsRangeSelect = document.getElementById("analytics-range");
const analyticsUpdated = document.getElementById("analytics-updated");
const metricUnique = document.getElementById("metric-unique");
const metricViews = document.getElementById("metric-views");
const metricProducts = document.getElementById("metric-products");
const metricInStock = document.getElementById("metric-instock");
const metricOutStock = document.getElementById("metric-outstock");
const metricCategories = document.getElementById("metric-categories");
const analyticsTopViews = document.getElementById("analytics-top-views");
const analyticsTopCart = document.getElementById("analytics-top-cart");
const analyticsGeo = document.getElementById("analytics-geo");
const chartViewsCanvas = document.getElementById("chart-views");
const chartProductViewsCanvas = document.getElementById("chart-product-views");
const chartCartCanvas = document.getElementById("chart-cart");
const productImageRemoveBtn = document.getElementById("product-image-remove");
const productImagesClearBtn = document.getElementById("product-images-clear");
const ANALYTICS_TABLE = "analytics_events";
let cachedVisitorHash = null;
let visitorHashPromise = null;
let chartViewsInstance = null;
let chartProductViewsInstance = null;
let chartCartInstance = null;
let pendingMainImageFile = null;
let pendingExtraImageFiles = [];
let pendingExtraImagePreviews = [];

function formatPrice(value) {
    const numericValue = Number(value) || 0;
    return `R$ ${numericValue.toFixed(2).replace(".", ",")}`;
}

function parsePrice(value) {
    if (typeof value === "number") {
        return value;
    }
    const cleaned = String(value).replace(/[R$\s]/g, "");
    if (cleaned.includes(",")) {
        const normalized = cleaned.replace(/\./g, "").replace(",", ".");
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    const normalized = cleaned.replace(/,/g, "");
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function parsePercent(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }
    const cleaned = String(value || "").replace("%", "").replace(",", ".").trim();
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatDiscount(value) {
    const numericValue = Number(value) || 0;
    if (numericValue <= 0) {
        return "";
    }
    const fixed = numericValue % 1 === 0 ? numericValue.toFixed(0) : numericValue.toFixed(2);
    return fixed.replace(".", ",");
}

function parseStock(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }
    const parsed = parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatStockLabel(value) {
    const stockValue = Number(value) || 0;
    return stockValue > 0 ? `Estoque: ${stockValue} unid.` : "Sem estoque";
}

function formatFileSize(bytes) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function getFileKey(file) {
    return `${file.name}|${file.size}|${file.lastModified}`;
}

function loadImageDimensions(file) {
    return new Promise(function (resolve, reject) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = function () {
            const result = { width: img.naturalWidth, height: img.naturalHeight };
            URL.revokeObjectURL(url);
            resolve(result);
        };
        img.onerror = function () {
            URL.revokeObjectURL(url);
            reject(new Error("Nao foi possivel ler a imagem."));
        };
        img.src = url;
    });
}

async function validateImageFile(file) {
    if (!file) {
        return { ok: false, error: "Arquivo invalido." };
    }

    if (IMAGE_ALLOWED_TYPES.indexOf(file.type) === -1) {
        return { ok: false, error: "Formato invalido. Use JPG, PNG ou WEBP." };
    }

    if (file.size > IMAGE_MAX_BYTES) {
        return {
            ok: false,
            error: `Arquivo muito grande (${formatFileSize(file.size)}). Max ${formatFileSize(IMAGE_MAX_BYTES)}.`,
        };
    }

    try {
        const dimensions = await loadImageDimensions(file);
        const width = dimensions.width || 0;
        const height = dimensions.height || 0;
        const maxSide = Math.max(width, height);
        const ratio = height ? width / height : 0;

        if (maxSide > IMAGE_MAX_DIMENSION) {
            return {
                ok: false,
                error: `Resolucao muito grande (${width}x${height}). Max ${IMAGE_MAX_DIMENSION}px.`,
            };
        }

        if (ratio < IMAGE_MIN_RATIO || ratio > IMAGE_MAX_RATIO) {
            return {
                ok: false,
                error: "Proporcao fora do padrao. Use imagem mais quadrada.",
            };
        }
    } catch (error) {
        return { ok: false, error: "Nao foi possivel validar a imagem." };
    }

    return { ok: true };
}

function trackGaEvent(eventName, params) {
    if (typeof window.gtag !== "function") {
        return;
    }
    window.gtag("event", eventName, params || {});
}

function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(function (value) {
            return value.toString(16).padStart(2, "0");
        })
        .join("");
}

function buildVisitorFingerprint() {
    const parts = [
        navigator.userAgent || "",
        navigator.language || "",
        navigator.platform || "",
        `${window.screen.width}x${window.screen.height}`,
        Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    ];
    return parts.join("|");
}

async function getVisitorHash() {
    if (cachedVisitorHash) {
        return cachedVisitorHash;
    }
    if (visitorHashPromise) {
        return visitorHashPromise;
    }

    const fingerprint = buildVisitorFingerprint();
    if (!window.crypto || !window.crypto.subtle) {
        cachedVisitorHash = fingerprint;
        return cachedVisitorHash;
    }

    visitorHashPromise = window.crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(fingerprint))
        .then(function (hash) {
            cachedVisitorHash = bufferToHex(hash);
            return cachedVisitorHash;
        })
        .catch(function () {
            cachedVisitorHash = fingerprint;
            return cachedVisitorHash;
        });

    return visitorHashPromise;
}

async function trackAnalyticsEvent(eventType, product) {
    if (!supabaseReady || !supabaseClient) {
        return;
    }

    try {
        const payload = {
            event_type: eventType,
            page_url: window.location.pathname,
        };

        const visitorHash = await getVisitorHash();
        if (visitorHash) {
            payload.visitor_hash = visitorHash;
        }

        if (product && product.id) {
            payload.product_id = product.id;
            payload.product_name = product.name || null;
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/track-analytics`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return;
        }

        if (adminPanel && adminPanel.classList.contains("active") && isAdminLoggedIn()) {
            updateDashboard();
        }
    } catch (error) {
        return;
    }
}

function startDashboardPolling() {
    if (dashboardInterval) {
        clearInterval(dashboardInterval);
    }
    dashboardInterval = setInterval(function () {
        updateDashboard();
    }, 30000);
}

function stopDashboardPolling() {
    if (dashboardInterval) {
        clearInterval(dashboardInterval);
        dashboardInterval = null;
    }
}

function getAnalyticsRangeStart(days) {
    if (!days || days === 0) {
        return null;
    }
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
}

async function fetchAnalyticsEvents(days) {
    if (!supabaseReady || !supabaseClient || !isAdminLoggedIn()) {
        return [];
    }

    let query = supabaseClient
        .from(ANALYTICS_TABLE)
        .select("event_type, product_id, product_name, visitor_hash, country, region, city, created_at");

    const startDate = getAnalyticsRangeStart(days);
    if (startDate) {
        query = query.gte("created_at", startDate);
    }

    const response = await query;
    if (response.error) {
        console.error("Erro ao carregar analytics:", response.error);
        return [];
    }

    return response.data || [];
}

async function fetchGa4Dashboard(days) {
    if (!supabaseReady || !supabaseClient || !isAdminLoggedIn()) {
        return null;
    }

    const token = currentSession ? currentSession.access_token : null;
    if (!token) {
        return null;
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ga4-dashboard`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ days: days }),
        });

        if (!response.ok) {
            console.error("Erro ao buscar GA4:", response.status);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Erro ao buscar GA4:", error);
        return null;
    }
}

function formatGaLabel(value) {
    if (!value) {
        return "";
    }
    return value;
}

function buildLineChart(canvas, instance, labelText, labels, values) {
    if (!canvas || typeof window.Chart !== "function") {
        return instance;
    }

    if (instance) {
        instance.destroy();
    }

    const context = canvas.getContext("2d");
    if (!context) {
        return instance;
    }

    const gradient = context.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, "rgba(197, 160, 89, 0.45)");
    gradient.addColorStop(1, "rgba(197, 160, 89, 0)");

    return new window.Chart(context, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: labelText,
                    data: values,
                    borderColor: "#C5A059",
                    backgroundColor: gradient,
                    tension: 0.35,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: "rgba(255, 255, 255, 0.6)",
                        maxRotation: 0,
                        autoSkip: true,
                    },
                    grid: {
                        color: "rgba(255, 255, 255, 0.04)",
                    },
                },
                y: {
                    ticks: {
                        color: "rgba(255, 255, 255, 0.6)",
                    },
                    grid: {
                        color: "rgba(255, 255, 255, 0.04)",
                    },
                },
            },
        },
    });
}

function addToCart(name, price, productId) {
    const existingItem = cart.find(function (item) {
        return item.name === name;
    });

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name: name, price: price, quantity: 1 });
    }

    updateCart();
    bumpCartIcon("add");

    if (productId) {
        const product = products.find(function (current) {
            return current.id === productId;
        }) || { id: productId, name: name };
        trackAnalyticsEvent("add_to_cart", product);
        trackGaEvent("add_to_cart", {
            currency: "BRL",
            value: Number(price) || 0,
            items: [
                {
                    item_id: product.id,
                    item_name: product.name || name,
                    item_category: product.category || "",
                    price: Number(price) || 0,
                    quantity: 1,
                },
            ],
        });
    }
}

function updateCartIndicators(totalCount, totalValue) {
    if (cartCountBadge) {
        cartCountBadge.textContent = totalCount;
        cartCountBadge.classList.toggle("hidden", totalCount === 0);
    }

    if (cartTotalMini) {
        cartTotalMini.textContent = formatPrice(totalValue);
        cartTotalMini.classList.toggle("hidden", totalCount === 0);
    }
}

function bumpCartIcon(type) {
    if (!cartToggleBtn) {
        return;
    }

    cartToggleBtn.classList.remove("cart-bump", "cart-shake");
    void cartToggleBtn.offsetWidth;
    cartToggleBtn.classList.add(type === "remove" ? "cart-shake" : "cart-bump");

    if (cartCountBadge) {
        cartCountBadge.classList.remove("pulse");
        void cartCountBadge.offsetWidth;
        cartCountBadge.classList.add("pulse");
        setTimeout(function () {
            cartCountBadge.classList.remove("pulse");
        }, 600);
    }
}

function updateCart() {
    if (!cartItemsList || !cartTotal) {
        return;
    }

    cartItemsList.innerHTML = "";
    let total = 0;

    if (!cart.length) {
        const emptyRow = document.createElement("tr");
        emptyRow.className = "cart-empty-row";
        emptyRow.innerHTML = `<td colspan="3">Seu carrinho esta vazio.</td>`;
        cartItemsList.appendChild(emptyRow);
        cartTotal.textContent = formatPrice(0);
        updateCartIndicators(0, 0);
        return;
    }

    let totalCount = 0;

    cart.forEach(function (item, index) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="cart-item-name">${item.name}</div>
                <button class="cart-remove" onclick="removeFromCart(${index})">Remover</button>
            </td>
            <td>${item.quantity}</td>
            <td class="cart-price text-right">${formatPrice(item.price * item.quantity)}</td>
        `;
        cartItemsList.appendChild(row);
        total += item.price * item.quantity;
        totalCount += item.quantity;
    });

    cartTotal.textContent = formatPrice(total);
    updateCartIndicators(totalCount, total);
}

function removeFromCart(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    } else {
        cart.splice(index, 1);
    }
    updateCart();
    bumpCartIcon("remove");
}

function normalizeCep(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 8);
}

async function fetchCepAddress(cep) {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) {
        throw new Error("Falha ao consultar o CEP.");
    }
    const data = await response.json();
    if (data.erro) {
        throw new Error("CEP nao encontrado.");
    }
    return data;
}

async function handleCepLookup() {
    if (!cartCepInput) {
        return;
    }

    const cep = normalizeCep(cartCepInput.value);
    if (cep.length !== 8) {
        return;
    }

    try {
        cartCepInput.classList.add("input-loading");
        const data = await fetchCepAddress(cep);
        if (cartStreetInput) {
            cartStreetInput.value = data.logradouro || "";
        }
        if (cartNeighborhoodInput) {
            cartNeighborhoodInput.value = data.bairro || "";
        }
        if (cartCityInput) {
            const cityValue = [data.localidade, data.uf].filter(Boolean).join(" - ");
            cartCityInput.value = cityValue;
        }
    } catch (error) {
        alert(error.message || "Nao foi possivel consultar o CEP.");
    } finally {
        cartCepInput.classList.remove("input-loading");
    }
}

if (cartCepInput) {
    cartCepInput.addEventListener("blur", handleCepLookup);
    cartCepInput.addEventListener("input", function () {
        cartCepInput.value = normalizeCep(cartCepInput.value);
        if (cartCepInput.value.length === 8) {
            handleCepLookup();
        }
    });
}

function finalizePurchase() {
    if (cart.length === 0) {
        alert("Seu carrinho esta vazio.");
        return;
    }

    if (cartOpenedAt && Date.now() - cartOpenedAt < 600) {
        return;
    }

    const whatsappNumber = "5511970618002";
    const orderDetails = cart
        .map(function (item) {
            return `${item.name} (x${item.quantity}) - ${formatPrice(item.price * item.quantity)}`;
        })
        .join("\n");
    const total = cart.reduce(function (sum, item) {
        return sum + item.price * item.quantity;
    }, 0);

    const customerName = document.getElementById("cart-customer-name");
    const customerCep = document.getElementById("cart-customer-cep");
    const customerStreet = document.getElementById("cart-customer-street");
    const customerNumber = document.getElementById("cart-customer-number");
    const customerNeighborhood = document.getElementById("cart-customer-neighborhood");
    const customerCity = document.getElementById("cart-customer-city");
    const customerPayment = document.getElementById("cart-payment-method");
    const customerDelivery = document.getElementById("cart-delivery-method");
    const customerNotes = document.getElementById("cart-notes");

    const customerLines = [];
    const nameValue = customerName && customerName.value.trim()
        ? customerName.value.trim()
        : "Nao informado";
    const cepValue = customerCep && customerCep.value.trim()
        ? customerCep.value.trim()
        : "Nao informado";
    const streetValue = customerStreet && customerStreet.value.trim()
        ? customerStreet.value.trim()
        : "Nao informado";
    const numberValue = customerNumber && customerNumber.value.trim()
        ? customerNumber.value.trim()
        : "Nao informado";
    const neighborhoodValue = customerNeighborhood && customerNeighborhood.value.trim()
        ? customerNeighborhood.value.trim()
        : "Nao informado";
    const cityValue = customerCity && customerCity.value.trim()
        ? customerCity.value.trim()
        : "Nao informado";
    const paymentValue = customerPayment && customerPayment.value.trim()
        ? customerPayment.value.trim()
        : "Nao informado";
    const deliveryValue = customerDelivery && customerDelivery.value.trim()
        ? customerDelivery.value.trim()
        : "Nao informado";

    customerLines.push(`Nome: ${nameValue}`);
    customerLines.push(`CEP: ${cepValue}`);
    customerLines.push(`Endereco: ${streetValue}`);
    customerLines.push(`Numero: ${numberValue}`);
    customerLines.push(`Bairro: ${neighborhoodValue}`);
    customerLines.push(`Cidade/UF: ${cityValue}`);
    customerLines.push(`Pagamento: ${paymentValue}`);
    customerLines.push(`Entrega ou Retirada: ${deliveryValue}`);

    if (customerNotes && customerNotes.value.trim()) {
        customerLines.push(`Observacoes: ${customerNotes.value.trim()}`);
    }

    const message = encodeURIComponent(
        `Ola! Gostaria de finalizar meu pedido com a Mitico Profissional.\n\n` +
            `Itens do carrinho:\n${orderDetails}\n\n` +
            `Total estimado: ${formatPrice(total)}\n\n` +
            `Dados do cliente:\n${customerLines.join("\n")}`
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(whatsappUrl, "_blank");
}

function openWhatsAppForProduct(name, priceValue) {
    const whatsappNumber = "5511970618002";
    const message = encodeURIComponent(
        `Ola, gostaria de comprar o produto ${name} por ${formatPrice(priceValue)}.`
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank");
}

function filterProducts() {
    if (!searchBar) {
        return;
    }
    const value = searchBar.value.toLowerCase();
    const category = currentCategory;

    const filtered = products.filter(function (product) {
        const name = String(product.name || "").toLowerCase();
        const description = String(product.description || "").toLowerCase();
        const matchesSearch = name.includes(value) || description.includes(value);
        const productCategory = String(product.category || "").toLowerCase();
        const matchesCategory =
            category === "Todos" || productCategory === category.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    renderProducts(pageItems);
    renderPagination(totalPages, filtered.length);
}

function showCartNotification(productName) {
    if (!cartNotification) {
        return;
    }

    cartNotification.innerHTML = "";
    const text = document.createElement("span");
    text.textContent = `${productName} adicionado ao carrinho.`;
    cartNotification.appendChild(text);

    const goToCartBtn = document.createElement("button");
    goToCartBtn.textContent = "Abrir Carrinho";
    goToCartBtn.style.cssText =
        "margin-left: 10px; padding: 5px 10px; background-color: #111827; color: white; border: none; cursor: pointer; border-radius: 5px;";

    goToCartBtn.onclick = function () {
        openCartPanel();
    };

    cartNotification.appendChild(goToCartBtn);
    cartNotification.style.display = "block";

    if (showCartNotification.timer) {
        clearTimeout(showCartNotification.timer);
    }
    showCartNotification.timer = setTimeout(function () {
        cartNotification.style.display = "none";
    }, 3000);
}

const SUPABASE_URL = "https://psdtuhaipbeivshporck.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YyRkw7pBUdI3lbolwGiWtA_erzcdmld";
const ADMIN_EMAIL = "MiticoProfissional@gmail.com";

const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
const supabaseReady =
    Boolean(supabaseClient) &&
    SUPABASE_URL.indexOf("YOUR_PROJECT") === -1 &&
    SUPABASE_ANON_KEY.indexOf("YOUR_ANON_KEY") === -1;

const productsContainer = document.getElementById("products");
const categoryFilters = document.getElementById("category-filters");
const paginationContainer = document.getElementById("pagination");
let products = [];
let productRevealObserver = null;

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (match) {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };
        return map[match] || match;
    });
}

function getProductImages(product) {
    const images = [];
    const primary = product.image_url || product.image || "";
    if (primary) {
        images.push(primary);
    }

    const extraList = normalizeImageUrls(product.image_urls);
    if (extraList.length) {
        extraList.forEach(function (url) {
            if (url && !images.includes(url)) {
                images.push(url);
            }
        });
    }

    if (product.image_url_secondary && !images.includes(product.image_url_secondary)) {
        images.push(product.image_url_secondary);
    }

    return images;
}

function getExtraImages(product) {
    const extras = [];
    const primary = product.image_url || product.image || "";

    const extraList = normalizeImageUrls(product.image_urls);
    if (extraList.length) {
        extraList.forEach(function (url) {
            if (url && url !== primary && !extras.includes(url)) {
                extras.push(url);
            }
        });
    }

    if (product.image_url_secondary && product.image_url_secondary !== primary && !extras.includes(product.image_url_secondary)) {
        extras.push(product.image_url_secondary);
    }

    return extras;
}

function normalizeImageUrls(value) {
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return [];
}

function getProductsFromDom() {
    if (!productsContainer) {
        return [];
    }

    const cards = Array.from(productsContainer.querySelectorAll(".product-card"));
    return cards
        .map(function (card, index) {
            const nameEl = card.querySelector("h3");
            const descEl = card.querySelector("p:not(.preco)");
            const priceEl = card.querySelector(".preco");
            const imgEl = card.querySelector("img");

            const name = nameEl ? nameEl.textContent.trim() : "";
            const description = descEl ? descEl.textContent.trim() : "";
            const price = priceEl ? parsePrice(priceEl.textContent) : 0;
            const image = imgEl ? imgEl.getAttribute("src") : "";

            return {
                id: `p-${index + 1}`,
                name: name,
                description: description,
                price: price,
                image: image,
                discount_percent: 0,
                stock_quantity: 0,
                category: "",
                image_urls: [],
            };
        })
        .filter(function (product) {
            return product.name;
        });
}

function setupProductReveal() {
    if (!productsContainer) {
        return;
    }

    const cards = Array.from(productsContainer.querySelectorAll(".product-card"));
    if (productRevealObserver) {
        productRevealObserver.disconnect();
    }

    if (!cards.length) {
        return;
    }

    if (prefersReducedMotion()) {
        cards.forEach(function (card) {
            card.classList.add("is-visible");
            card.style.setProperty("--reveal-delay", "0ms");
        });
        return;
    }

    productRevealObserver = new IntersectionObserver(
        function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    cards.forEach(function (card, index) {
        const delay = Math.min(index * 70, 280);
        card.classList.remove("is-visible");
        card.style.setProperty("--reveal-delay", `${delay}ms`);
        productRevealObserver.observe(card);
    });
}

function renderProducts(list) {
    if (!productsContainer) {
        return;
    }

    if (!list.length) {
        productsContainer.innerHTML = "<p>Sem produtos cadastrados.</p>";
        if (productRevealObserver) {
            productRevealObserver.disconnect();
        }
        return;
    }

    Object.keys(productImageIndexes).forEach(function (key) {
        delete productImageIndexes[key];
    });

    productsContainer.innerHTML = list
        .map(function (product) {
            const safeName = escapeHtml(product.name);
            const safeDesc = escapeHtml(product.description || "").replace(/\n/g, "<br>");
            const images = getProductImages(product);
            const safeImg = escapeHtml(images[0] || "");
            const safeCategory = escapeHtml(product.category || "");
            const priceValue = Number(product.price) || 0;
            const discountPercentRaw = Number(product.discount_percent) || 0;
            const discountPercent = Math.max(0, Math.min(discountPercentRaw, 100));
            const hasDiscount = discountPercent > 0;
            const finalPriceValue = hasDiscount
                ? Number((priceValue * (1 - discountPercent / 100)).toFixed(2))
                : priceValue;
            const priceLabel = formatPrice(finalPriceValue);
            const originalLabel = formatPrice(priceValue);
            const discountLabel = formatDiscount(discountPercent);
            const badgeHtml = hasDiscount
                ? `<span class="discount-badge">-${discountLabel}%</span>`
                : "";
            const priceHtml = hasDiscount
                ? `
                <div class="price-stack">
                  <span class="preco-original">${originalLabel}</span>
                  <span class="preco text-primary font-bold text-xl">${priceLabel}</span>
                </div>
              `
                : `<span class="preco text-primary font-bold text-xl">${priceLabel}</span>`;
            const stockValue = Number(product.stock_quantity) || 0;
            const stockLabel = stockValue > 0 ? `Estoque: ${stockValue} unid.` : "Sem estoque";
            const stockClass = stockValue > 0 ? "stock-label" : "stock-label stock-out";
            const isOutOfStock = stockValue <= 0;
            const stockBadgeHtml = isOutOfStock ? `<span class="stock-badge">Esgotado</span>` : "";
            const disabledAttr = isOutOfStock ? "disabled" : "";
            const disabledClass = isOutOfStock ? "is-disabled" : "";
            const categoryHtml = safeCategory
                ? `<span class="product-category">${safeCategory}</span>`
                : "";
            const hasAltImage = images.length > 1;
            const toggleHtml = hasAltImage
                ? `<button class="image-toggle-btn" type="button" data-action="toggle-image" aria-label="Trocar imagem">
                     <span class="material-icons">flip_camera_android</span>
                   </button>`
                : "";

            return `
          <div class="product-card group bg-neutral-900/50 rounded-xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all ${disabledClass}" data-id="${product.id}">
            <div class="aspect-square overflow-hidden relative">
              <img src="${safeImg}" alt="${safeName}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" decoding="async">
              ${badgeHtml}
              ${stockBadgeHtml}
              ${toggleHtml}
            </div>
            <div class="p-6 flex flex-col gap-3">
              <h3 class="text-white font-semibold text-lg">${safeName}</h3>
              ${categoryHtml}
              <p class="text-gray-400 text-sm">${safeDesc}</p>
              <p class="${stockClass}">${stockLabel}</p>
              <div class="flex items-center justify-between mt-auto">
                ${priceHtml}
                <button class="button-card addAlert bg-primary hover:bg-white text-black p-2 rounded-lg transition-colors flex items-center justify-center" data-id="${product.id}" data-name="${safeName}" data-price="${finalPriceValue}" ${disabledAttr}>
                  <span class="material-icons text-xl">add_shopping_cart</span>
                </button>
              </div>
            </div>
          </div>
        `;
        })
        .join("");

    setupProductReveal();
}

function openProductModal(product) {
    if (!productModal) {
        return;
    }

    const name = product.name || "";
    const description = product.description || "";
    const category = product.category || "";
    const priceValue = Number(product.price) || 0;
    const discountPercentRaw = Number(product.discount_percent) || 0;
    const discountPercent = Math.max(0, Math.min(discountPercentRaw, 100));
    const hasDiscount = discountPercent > 0;
    const finalPriceValue = hasDiscount
        ? Number((priceValue * (1 - discountPercent / 100)).toFixed(2))
        : priceValue;

    const images = getProductImages(product);

    trackAnalyticsEvent("product_view", product);
    trackGaEvent("view_item", {
        currency: "BRL",
        value: Number(finalPriceValue) || 0,
        items: [
            {
                item_id: product.id || "",
                item_name: name,
                item_category: category,
                price: Number(priceValue) || 0,
            },
        ],
    });

    if (productModalTitle) {
        productModalTitle.textContent = name;
    }
    if (productModalDescription) {
        productModalDescription.textContent = description;
    }
    if (productModalCategory) {
        productModalCategory.textContent = category;
        productModalCategory.classList.toggle("hidden", !category);
    }
    if (productModalPrice) {
        productModalPrice.textContent = formatPrice(finalPriceValue);
    }
    if (productModalPriceOriginal) {
        productModalPriceOriginal.textContent = formatPrice(priceValue);
        productModalPriceOriginal.classList.toggle("hidden", !hasDiscount);
    }
    if (productModalDiscount) {
        const discountLabel = formatDiscount(discountPercent);
        productModalDiscount.textContent = hasDiscount ? `-${discountLabel}%` : "";
        productModalDiscount.classList.toggle("hidden", !hasDiscount);
    }
    if (productModalStock) {
        productModalStock.textContent = formatStockLabel(product.stock_quantity);
        productModalStock.classList.toggle("stock-out", (Number(product.stock_quantity) || 0) <= 0);
    }

    if (productModalImage) {
        productModalImage.src = images[0] || "";
        productModalImage.alt = name;
    }

    if (productModalThumbs) {
        productModalThumbs.innerHTML = "";
        productModalThumbs.classList.toggle("hidden", images.length <= 1);
        images.forEach(function (imageUrl, index) {
            const thumb = document.createElement("button");
            thumb.type = "button";
            thumb.className = "product-modal-thumb";
            if (index === 0) {
                thumb.classList.add("active");
            }
            const img = document.createElement("img");
            img.src = imageUrl;
            img.alt = name;
            thumb.appendChild(img);
            thumb.addEventListener("click", function () {
                if (productModalImage) {
                    productModalImage.src = imageUrl;
                }
                productModalThumbs.querySelectorAll(".product-modal-thumb").forEach(function (item) {
                    item.classList.toggle("active", item === thumb);
                });
            });
            productModalThumbs.appendChild(thumb);
        });
    }

    if (productModalAdd) {
        productModalAdd.dataset.name = name;
        productModalAdd.dataset.price = String(finalPriceValue);
        productModalAdd.dataset.id = product.id || "";
        productModalAdd.disabled = (Number(product.stock_quantity) || 0) <= 0;
    }

    if (productModalWhatsapp) {
        productModalWhatsapp.dataset.name = name;
        productModalWhatsapp.dataset.price = String(finalPriceValue);
    }

    productModal.classList.add("active");
    productModal.setAttribute("aria-hidden", "false");
}

function closeProductModal() {
    if (!productModal) {
        return;
    }
    productModal.classList.remove("active");
    productModal.setAttribute("aria-hidden", "true");
}

function populateCategorySelect() {
    if (!productCategoryInput) {
        return;
    }

    const options = ['<option value="">Selecione uma categoria</option>']
        .concat(
            PRODUCT_CATEGORIES.map(function (category) {
                return `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
            })
        )
        .join("");

    productCategoryInput.innerHTML = options;
}

function populateAdminCategoryFilter() {
    if (!adminCategoryFilter) {
        return;
    }

    const options = ['<option value="">Todas as categorias</option>']
        .concat(
            PRODUCT_CATEGORIES.map(function (category) {
                return `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
            })
        )
        .join("");

    adminCategoryFilter.innerHTML = options;
}

function renderCategoryFilters() {
    if (!categoryFilters) {
        return;
    }

    const allCategories = ["Todos"].concat(PRODUCT_CATEGORIES);
    categoryFilters.innerHTML = "";

    allCategories.forEach(function (category) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "category-btn";
        button.dataset.category = category;
        button.textContent = category;
        if (category === currentCategory) {
            button.classList.add("active");
        }
        categoryFilters.appendChild(button);
    });
}

function renderPagination(totalPages, totalItems) {
    if (!paginationContainer) {
        return;
    }

    paginationContainer.innerHTML = "";

    if (totalPages <= 1 || totalItems === 0) {
        paginationContainer.classList.add("hidden");
        return;
    }

    paginationContainer.classList.remove("hidden");

    const createButton = function (label, page, isActive, isDisabled) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "page-btn";
        if (isActive) {
            button.classList.add("active");
        }
        if (isDisabled) {
            button.disabled = true;
        }
        button.dataset.page = String(page);
        button.textContent = label;
        return button;
    };

    paginationContainer.appendChild(
        createButton("Anterior", Math.max(1, currentPage - 1), false, currentPage === 1)
    );

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
        paginationContainer.appendChild(createButton("1", 1, currentPage === 1, false));
        if (startPage > 2) {
            const dots = document.createElement("span");
            dots.className = "page-dots";
            dots.textContent = "...";
            paginationContainer.appendChild(dots);
        }
    }

    for (let page = startPage; page <= endPage; page += 1) {
        paginationContainer.appendChild(
            createButton(String(page), page, page === currentPage, false)
        );
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement("span");
            dots.className = "page-dots";
            dots.textContent = "...";
            paginationContainer.appendChild(dots);
        }
        paginationContainer.appendChild(
            createButton(String(totalPages), totalPages, currentPage === totalPages, false)
        );
    }

    paginationContainer.appendChild(
        createButton("Proxima", Math.min(totalPages, currentPage + 1), false, currentPage === totalPages)
    );
}

async function fetchProducts(options) {
    if (!productsContainer) {
        return;
    }

    if (!supabaseReady) {
        products = getProductsFromDom();
        filterProducts();
        if (options && options.updateAdminList) {
            renderAdminList();
        }
        updateDashboard();
        return;
    }

    productsContainer.innerHTML = "<p>Carregando produtos...</p>";
    const response = await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: true });

    if (response.error) {
        productsContainer.innerHTML = "<p>Erro ao carregar produtos.</p>";
        console.error("Erro ao carregar produtos:", response.error);
        return;
    }

    products = response.data || [];
    filterProducts();
    if (options && options.updateAdminList) {
        renderAdminList();
    }
    updateDashboard();
}

if (productsContainer) {
    productsContainer.addEventListener("click", function (event) {
        const button = event.target.closest("button.addAlert");
        if (!button) {
            return;
        }
        if (button.disabled) {
            return;
        }

        const name = button.dataset.name || "Produto";
        const price = parseFloat(button.dataset.price || "0");
        const id = button.dataset.id || "";

        addToCart(name, price, id);
        showCartNotification(name);
    });
}

if (productsContainer) {
    productsContainer.addEventListener("click", function (event) {
        const toggleButton = event.target.closest("button[data-action='toggle-image']");
        if (toggleButton) {
            const card = toggleButton.closest(".product-card");
            const imageEl = card ? card.querySelector("img") : null;
            const id = card ? card.dataset.id : "";
            const product = products.find(function (current) {
                return current.id === id;
            });

            if (!product || !imageEl) {
                return;
            }

            const images = getProductImages(product);
            if (images.length < 2) {
                return;
            }

            const currentIndex = Number(productImageIndexes[id] || 0);
            const nextIndex = (currentIndex + 1) % images.length;
            productImageIndexes[id] = nextIndex;
            imageEl.src = images[nextIndex];
            return;
        }

        if (event.target.closest("button.addAlert")) {
            return;
        }

        const card = event.target.closest(".product-card");
        if (!card) {
            return;
        }

        const id = card.dataset.id;
        const product = products.find(function (current) {
            return current.id === id;
        });

        if (product) {
            openProductModal(product);
        }
    });
}

if (categoryFilters) {
    categoryFilters.addEventListener("click", function (event) {
        const button = event.target.closest("button.category-btn");
        if (!button) {
            return;
        }

        currentCategory = button.dataset.category || "Todos";
        currentPage = 1;
        categoryFilters.querySelectorAll(".category-btn").forEach(function (item) {
            item.classList.toggle("active", item === button);
        });
        filterProducts();
    });
}

if (paginationContainer) {
    paginationContainer.addEventListener("click", function (event) {
        const button = event.target.closest("button.page-btn");
        if (!button || button.disabled) {
            return;
        }
        const page = parseInt(button.dataset.page || "1", 10);
        if (!Number.isFinite(page)) {
            return;
        }
        currentPage = page;
        filterProducts();
    });
}

if (searchBar) {
    searchBar.addEventListener("input", function () {
        currentPage = 1;
        filterProducts();
    });
}

if (analyticsRangeSelect) {
    analyticsRangeSelect.addEventListener("change", function () {
        updateDashboard();
    });
}

if (productModalClose) {
    productModalClose.addEventListener("click", closeProductModal);
}

if (productModal) {
    productModal.addEventListener("click", function (event) {
        if (event.target === productModal) {
            closeProductModal();
        }
    });
}

if (productModalAdd) {
    productModalAdd.addEventListener("click", function () {
        const name = productModalAdd.dataset.name || "Produto";
        const price = parseFloat(productModalAdd.dataset.price || "0");
        const id = productModalAdd.dataset.id || "";
        if (productModalAdd.disabled) {
            return;
        }
        addToCart(name, price, id);
        showCartNotification(name);
    });
}

if (productModalWhatsapp) {
    productModalWhatsapp.addEventListener("click", function () {
        const name = productModalWhatsapp.dataset.name || "Produto";
        const price = parseFloat(productModalWhatsapp.dataset.price || "0");
        openWhatsAppForProduct(name, price);
    });
}

const adminOpenBtn = document.getElementById("admin-open");
const adminPanel = document.getElementById("admin-panel");
const adminCloseBtn = document.getElementById("admin-close");
const adminLoginBlock = document.getElementById("admin-login");
const adminActionsBlock = document.getElementById("admin-actions");
const adminLoginBtn = document.getElementById("admin-login-btn");
const adminLogoutBtn = document.getElementById("admin-logout");
const adminUserInput = document.getElementById("admin-user");
const adminPassInput = document.getElementById("admin-pass");
const adminProductList = document.getElementById("admin-product-list");
const adminSearchInput = document.getElementById("admin-search");
const adminCategoryFilter = document.getElementById("admin-category-filter");
const adminPagination = document.getElementById("admin-pagination");
const productForm = document.getElementById("product-form");
const productIdInput = document.getElementById("product-id");
const productNameInput = document.getElementById("product-name");
const productPriceInput = document.getElementById("product-price");
const productDiscountInput = document.getElementById("product-discount");
const productStockInput = document.getElementById("product-stock");
const productCategoryInput = document.getElementById("product-category");
const productDescriptionInput = document.getElementById("product-description");
const productImageFileInput = document.getElementById("product-image-file");
const productImagePreview = document.getElementById("product-image-preview");
const productImagesExtraInput = document.getElementById("product-image-files-extra");
const productImagesPreview = document.getElementById("product-images-preview");
const productCancelBtn = document.getElementById("product-cancel");
let currentImageUrl = "";
let currentImageUrlsExtra = [];
let adminPage = 1;
let adminSearchQuery = "";
let adminCategoryValue = "";
let dashboardInterval = null;

let currentSession = null;

function isAdminEmail(email) {
    if (!ADMIN_EMAIL) {
        return true;
    }
    return String(email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function setAdminLoggedIn(session) {
    if (!adminLoginBlock || !adminActionsBlock) {
        return;
    }

    const loggedIn = Boolean(session && session.user && isAdminEmail(session.user.email));
    currentSession = loggedIn ? session : null;

    adminLoginBlock.classList.toggle("hidden", loggedIn);
    adminActionsBlock.classList.toggle("hidden", !loggedIn);
}

function isAdminLoggedIn() {
    return Boolean(currentSession && currentSession.user && isAdminEmail(currentSession.user.email));
}

async function initAdminSession() {
    if (!supabaseReady) {
        setAdminLoggedIn(null);
        return;
    }

    const response = await supabaseClient.auth.getSession();
    const session = response.data ? response.data.session : null;

    if (session && !isAdminEmail(session.user.email)) {
        await supabaseClient.auth.signOut();
        setAdminLoggedIn(null);
        return;
    }

    setAdminLoggedIn(session);

    supabaseClient.auth.onAuthStateChange(function (_event, newSession) {
        if (newSession && !isAdminEmail(newSession.user.email)) {
            supabaseClient.auth.signOut();
            setAdminLoggedIn(null);
            return;
        }
        setAdminLoggedIn(newSession);
    });
}

function openAdminPanel() {
    if (adminPanel) {
        adminPanel.classList.add("active");
    }
    if (isAdminLoggedIn()) {
        fetchProducts({ updateAdminList: true });
        updateDashboard();
        startDashboardPolling();
    }
}

function closeAdminPanel() {
    if (adminPanel) {
        adminPanel.classList.remove("active");
    }
    stopDashboardPolling();
}

function resetProductForm() {
    if (productForm) {
        productForm.reset();
    }
    if (productIdInput) {
        productIdInput.value = "";
    }
    if (productDiscountInput) {
        productDiscountInput.value = "";
    }
    if (productStockInput) {
        productStockInput.value = "";
    }
    if (productCategoryInput) {
        productCategoryInput.value = "";
    }
    currentImageUrl = "";
    currentImageUrlsExtra = [];
    pendingMainImageFile = null;
    pendingExtraImageFiles = [];
    pendingExtraImagePreviews = [];
    clearImageInputs();
}

function setImagePreview(source, target) {
    const previewTarget = target || productImagePreview;
    if (!previewTarget) {
        return;
    }

    previewTarget.innerHTML = "";

    if (!source) {
        previewTarget.textContent = "Sem imagem selecionada.";
        return;
    }

    const img = document.createElement("img");
    img.src = source;
    img.alt = "Preview";
    previewTarget.appendChild(img);
}

function renderExtraPreviews(urls) {
    if (!productImagesPreview) {
        return;
    }

    productImagesPreview.innerHTML = "";

    if (!urls || urls.length === 0) {
        productImagesPreview.textContent = "Sem imagens extras.";
        return;
    }

    urls.forEach(function (item) {
        const wrapper = document.createElement("div");
        wrapper.className = "admin-image-thumb";

        const img = document.createElement("img");
        img.src = item.src || "";
        img.alt = "Imagem extra";

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "admin-thumb-remove";
        removeBtn.textContent = "Remover";
        removeBtn.dataset.source = item.source;
        removeBtn.dataset.index = String(item.index);

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        productImagesPreview.appendChild(wrapper);
    });
}

function clearImageInputs() {
    if (productImageFileInput) {
        productImageFileInput.value = "";
    }
    setImagePreview("", productImagePreview);
    if (productImagesExtraInput) {
        productImagesExtraInput.value = "";
    }
    pendingExtraImagePreviews = [];
    updateExtraPreviews();
    pendingMainImageFile = null;
    pendingExtraImageFiles = [];
}

function buildExtraPreviewItems() {
    const items = [];
    currentImageUrlsExtra.forEach(function (url, index) {
        items.push({ src: url, source: "existing", index: index });
    });
    pendingExtraImagePreviews.forEach(function (preview, index) {
        items.push({ src: preview.src, source: "pending", index: index });
    });
    return items;
}

function updateExtraPreviews() {
    renderExtraPreviews(buildExtraPreviewItems());
}

function sanitizeFileName(name) {
    return String(name || "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadProductImage(file) {
    if (!supabaseReady) {
        return { error: { message: "Supabase nao configurado." } };
    }

    const fileName = sanitizeFileName(file.name);
    const uniqueSuffix = Math.random().toString(36).slice(2, 8);
    const filePath = `products/${Date.now()}-${uniqueSuffix}-${fileName}`;
    const response = await supabaseClient.storage
        .from("product-images")
        .upload(filePath, file, { upsert: true });

    if (response.error) {
        console.error("Erro ao enviar imagem:", response.error);
        return { error: response.error };
    }

    const publicData = supabaseClient.storage.from("product-images").getPublicUrl(filePath);
    return { url: publicData.data.publicUrl };
}

function renderAdminList() {
    if (!adminProductList) {
        return;
    }

    adminProductList.innerHTML = "";

    const filtered = products.filter(function (product) {
        const name = String(product.name || "").toLowerCase();
        const matchesSearch = !adminSearchQuery || name.includes(adminSearchQuery);
        const categoryValue = String(product.category || "").toLowerCase();
        const matchesCategory = !adminCategoryValue || categoryValue === adminCategoryValue;
        return matchesSearch && matchesCategory;
    });

    if (!filtered.length) {
        adminProductList.textContent = "Sem produtos cadastrados.";
        renderAdminPagination(0);
        return;
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (adminPage > totalPages) {
        adminPage = totalPages;
    }

    const start = (adminPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    pageItems.forEach(function (product) {
        const item = document.createElement("div");
        item.className = "admin-item";
        item.dataset.id = product.id;

        const info = document.createElement("div");
        info.className = "admin-item-info";

        const name = document.createElement("strong");
        name.textContent = product.name;

        const price = document.createElement("span");
        const discountPercent = Number(product.discount_percent) || 0;
        const discountLabel = formatDiscount(discountPercent);
        price.textContent = formatPrice(product.price);

        const discount = document.createElement("span");
        discount.textContent = discountPercent > 0 ? `Desconto ${discountLabel}%` : "Sem desconto";

        const stockValue = Number(product.stock_quantity) || 0;
        const stock = document.createElement("span");
        stock.textContent = `Estoque ${stockValue} unid.`;

        const category = document.createElement("span");
        category.textContent = product.category ? `Categoria ${product.category}` : "Categoria nao definida";

        info.appendChild(name);
        info.appendChild(price);
        info.appendChild(discount);
        info.appendChild(stock);
        info.appendChild(category);

        const actions = document.createElement("div");
        actions.className = "admin-item-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.dataset.action = "edit";
        editBtn.textContent = "Alterar";

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.dataset.action = "remove";
        removeBtn.textContent = "Remover";

        actions.appendChild(editBtn);
        actions.appendChild(removeBtn);

        item.appendChild(info);
        item.appendChild(actions);
        adminProductList.appendChild(item);
    });

    renderAdminPagination(totalPages);
}

function renderAdminPagination(totalPages) {
    if (!adminPagination) {
        return;
    }

    adminPagination.innerHTML = "";

    if (totalPages <= 1) {
        adminPagination.classList.add("hidden");
        return;
    }

    adminPagination.classList.remove("hidden");

    const createButton = function (label, page, isActive, isDisabled) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "page-btn";
        if (isActive) {
            button.classList.add("active");
        }
        if (isDisabled) {
            button.disabled = true;
        }
        button.dataset.page = String(page);
        button.textContent = label;
        return button;
    };

    adminPagination.appendChild(
        createButton("Anterior", Math.max(1, adminPage - 1), false, adminPage === 1)
    );

    const maxButtons = 5;
    let startPage = Math.max(1, adminPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
        adminPagination.appendChild(createButton("1", 1, adminPage === 1, false));
        if (startPage > 2) {
            const dots = document.createElement("span");
            dots.className = "page-dots";
            dots.textContent = "...";
            adminPagination.appendChild(dots);
        }
    }

    for (let page = startPage; page <= endPage; page += 1) {
        adminPagination.appendChild(
            createButton(String(page), page, page === adminPage, false)
        );
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement("span");
            dots.className = "page-dots";
            dots.textContent = "...";
            adminPagination.appendChild(dots);
        }
        adminPagination.appendChild(
            createButton(String(totalPages), totalPages, adminPage === totalPages, false)
        );
    }

    adminPagination.appendChild(
        createButton("Proxima", Math.min(totalPages, adminPage + 1), false, adminPage === totalPages)
    );
}

async function updateDashboard() {
    if (!metricProducts || !metricInStock || !metricOutStock || !metricCategories) {
        return;
    }

    const totalProducts = products.length;
    const inStockCount = products.filter(function (product) {
        return Number(product.stock_quantity) > 0;
    }).length;
    const outStockCount = totalProducts - inStockCount;
    const stockUnitsTotal = products.reduce(function (sum, product) {
        const qty = Number(product.stock_quantity) || 0;
        return sum + Math.max(0, qty);
    }, 0);
    const categoryCount = new Set(
        products.map(function (product) {
            return product.category;
        }).filter(Boolean)
    ).size;

    metricProducts.textContent = String(totalProducts);
    metricInStock.textContent = String(stockUnitsTotal);
    metricOutStock.textContent = String(outStockCount);
    metricCategories.textContent = String(categoryCount);

    const setText = function (element, value) {
        if (element) {
            element.textContent = value;
        }
    };

    const renderList = function (container, items, emptyLabel) {
        if (!container) {
            return;
        }
        container.innerHTML = "";
        if (!items.length) {
            const empty = document.createElement("li");
            empty.className = "admin-analytics-empty";
            empty.textContent = emptyLabel;
            container.appendChild(empty);
            return;
        }
        items.forEach(function (item) {
            const li = document.createElement("li");
            li.innerHTML = `<span>${escapeHtml(item.name)}</span><strong>${item.total}</strong>`;
            container.appendChild(li);
        });
    };

    const hasGaTargets = Boolean(
        metricUnique ||
            metricViews ||
            analyticsTopViews ||
            analyticsTopCart ||
            analyticsGeo ||
            chartViewsCanvas ||
            chartProductViewsCanvas ||
            chartCartCanvas
    );

    if (!hasGaTargets) {
        if (analyticsUpdated) {
            analyticsUpdated.textContent = "";
        }
        return;
    }

    if (!supabaseReady || !isAdminLoggedIn()) {
        setText(metricUnique, "0");
        setText(metricViews, "0");
        renderList(analyticsTopViews, [], "Sem cliques ainda.");
        renderList(analyticsTopCart, [], "Sem adicionados ainda.");
        if (analyticsGeo) {
            analyticsGeo.textContent = "Sem dados de geolocalizacao.";
        }
        return;
    }

    const rangeDays = analyticsRangeSelect ? parseInt(analyticsRangeSelect.value || "30", 10) : 30;
    const days = Number.isFinite(rangeDays) ? rangeDays : 30;
    const gaData = await fetchGa4Dashboard(days);

    if (!gaData || !gaData.summary) {
        setText(metricUnique, "0");
        setText(metricViews, "0");
        renderList(analyticsTopViews, [], "Sem cliques ainda.");
        renderList(analyticsTopCart, [], "Sem adicionados ainda.");
        if (analyticsGeo) {
            analyticsGeo.textContent = "Sem dados de geolocalizacao.";
        }
        return;
    }

    setText(metricUnique, String(gaData.summary.activeUsers || 0));
    setText(metricViews, String(gaData.summary.screenPageViews || 0));

    renderList(analyticsTopViews, gaData.topViews || [], "Sem cliques ainda.");
    renderList(analyticsTopCart, gaData.topCart || [], "Sem adicionados ainda.");

    if (analyticsGeo) {
        analyticsGeo.innerHTML = "";
        const geoEntries = Array.isArray(gaData.geo) ? gaData.geo : [];
        if (!geoEntries.length) {
            analyticsGeo.textContent = "Sem dados de geolocalizacao.";
        } else {
            geoEntries.forEach(function (item) {
                const row = document.createElement("div");
                row.className = "admin-geo-row";
                row.innerHTML = `<span>${escapeHtml(item.name)}</span><strong>${item.total}</strong>`;
                analyticsGeo.appendChild(row);
            });
        }
    }

    if (gaData.charts) {
        const views = gaData.charts.views || { labels: [], values: [] };
        const productViews = gaData.charts.productViews || { labels: [], values: [] };
        const cartViews = gaData.charts.cart || { labels: [], values: [] };

        chartViewsInstance = buildLineChart(
            chartViewsCanvas,
            chartViewsInstance,
            "Visitas",
            (views.labels || []).map(formatGaLabel),
            views.values || []
        );
        chartProductViewsInstance = buildLineChart(
            chartProductViewsCanvas,
            chartProductViewsInstance,
            "Cliques em produtos",
            (productViews.labels || []).map(formatGaLabel),
            productViews.values || []
        );
        chartCartInstance = buildLineChart(
            chartCartCanvas,
            chartCartInstance,
            "Adicionados ao carrinho",
            (cartViews.labels || []).map(formatGaLabel),
            cartViews.values || []
        );
    }

    if (analyticsUpdated) {
        const time = gaData.fetchedAt
            ? new Date(gaData.fetchedAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
              })
            : new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        analyticsUpdated.textContent = `Atualizado ${time}`;
    }
}

async function upsertProduct(product) {
    if (!supabaseReady) {
        alert("Configure SUPABASE_URL e SUPABASE_ANON_KEY.");
        return;
    }

    const payload = {
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        image_urls: product.image_urls,
        discount_percent: product.discount_percent,
        stock_quantity: product.stock_quantity,
        category: product.category,
    };

    let response;
    if (product.id) {
        response = await supabaseClient.from("products").update(payload).eq("id", product.id);
    } else {
        response = await supabaseClient.from("products").insert(payload);
    }

    if (response.error) {
        const errorParts = [
            response.error.message,
            response.error.details,
            response.error.hint,
        ].filter(Boolean);
        alert(`Erro ao salvar produto: ${errorParts.join(" - ") || "Tente novamente."}`);
        console.error("Erro ao salvar produto:", response.error);
        return;
    }

    await fetchProducts({ updateAdminList: true });
    resetProductForm();
}

if (adminOpenBtn) {
    adminOpenBtn.addEventListener("click", openAdminPanel);
}

if (adminCloseBtn) {
    adminCloseBtn.addEventListener("click", closeAdminPanel);
}

if (adminPanel) {
    adminPanel.addEventListener("click", function (event) {
        if (event.target === adminPanel) {
            closeAdminPanel();
        }
    });
}

if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", async function () {
        if (!supabaseReady) {
            alert("Configure SUPABASE_URL e SUPABASE_ANON_KEY.");
            return;
        }

        const email = adminUserInput ? adminUserInput.value.trim() : "";
        const password = adminPassInput ? adminPassInput.value : "";

        if (!email || !password) {
            alert("Preencha email e senha.");
            return;
        }

        const response = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (response.error || !response.data || !response.data.session) {
            alert("Usuario ou senha invalidos.");
            return;
        }

        if (!isAdminEmail(response.data.user.email)) {
            await supabaseClient.auth.signOut();
            alert("Usuario sem permissao.");
            return;
        }

        setAdminLoggedIn(response.data.session);
        adminPage = 1;
        adminSearchQuery = "";
        adminCategoryValue = "";
        if (adminSearchInput) {
            adminSearchInput.value = "";
        }
        if (adminCategoryFilter) {
            adminCategoryFilter.value = "";
        }
        fetchProducts({ updateAdminList: true });
    });
}

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", async function () {
        if (supabaseReady) {
            await supabaseClient.auth.signOut();
        }
        setAdminLoggedIn(null);
        resetProductForm();
        adminPage = 1;
        adminSearchQuery = "";
        adminCategoryValue = "";
        if (adminSearchInput) {
            adminSearchInput.value = "";
        }
        if (adminCategoryFilter) {
            adminCategoryFilter.value = "";
        }
        stopDashboardPolling();
    });
}

if (adminSearchInput) {
    adminSearchInput.addEventListener("input", function () {
        adminSearchQuery = adminSearchInput.value.trim().toLowerCase();
        adminPage = 1;
        renderAdminList();
    });
}

if (adminCategoryFilter) {
    adminCategoryFilter.addEventListener("change", function () {
        adminCategoryValue = adminCategoryFilter.value.trim().toLowerCase();
        adminPage = 1;
        renderAdminList();
    });
}

if (adminPagination) {
    adminPagination.addEventListener("click", function (event) {
        const button = event.target.closest("button.page-btn");
        if (!button || button.disabled) {
            return;
        }
        const page = parseInt(button.dataset.page || "1", 10);
        if (!Number.isFinite(page)) {
            return;
        }
        adminPage = page;
        renderAdminList();
    });
}

if (productForm) {
    productForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!isAdminLoggedIn()) {
            return;
        }

        if (!supabaseReady) {
            alert("Configure SUPABASE_URL e SUPABASE_ANON_KEY.");
            return;
        }

        const name = productNameInput ? productNameInput.value.trim() : "";
        const description = productDescriptionInput ? productDescriptionInput.value.trim() : "";
        const price = productPriceInput ? parsePrice(productPriceInput.value) : 0;
        const discountValue = productDiscountInput ? parsePercent(productDiscountInput.value) : 0;
        const discountPercent = Math.max(0, Math.min(discountValue, 100));
        const normalizedDiscount = Number(discountPercent.toFixed(2));
        const stockValue = productStockInput ? parseStock(productStockInput.value) : 0;
        const stockQuantity = Math.max(0, Math.floor(stockValue));
        const categoryValue = productCategoryInput ? productCategoryInput.value.trim() : "";
        const file = pendingMainImageFile;
        const extraFiles = pendingExtraImageFiles.slice();

        if (extraFiles.length > 4) {
            alert("Selecione no maximo 4 imagens extras.");
            return;
        }

        let imageUrl = currentImageUrl;
        let extraUrls = currentImageUrlsExtra.slice();

        if (file) {
            const upload = await uploadProductImage(file);
            if (upload.error) {
                const errorParts = [
                    upload.error.message,
                    upload.error.details,
                    upload.error.hint,
                ].filter(Boolean);
                alert(`Erro ao enviar imagem: ${errorParts.join(" - ") || "Tente novamente."}`);
                return;
            }
            imageUrl = upload.url || "";
        }
        if (extraFiles.length > 0) {
            const uploadedUrls = [];
            for (const extraFile of extraFiles) {
                const uploadExtra = await uploadProductImage(extraFile);
                if (uploadExtra.error) {
                    const errorParts = [
                        uploadExtra.error.message,
                        uploadExtra.error.details,
                        uploadExtra.error.hint,
                    ].filter(Boolean);
                    alert(`Erro ao enviar imagem extra: ${errorParts.join(" - ") || "Tente novamente."}`);
                    return;
                }
                if (uploadExtra.url) {
                    uploadedUrls.push(uploadExtra.url);
                }
            }

            const combinedUrls = currentImageUrlsExtra.slice();
            uploadedUrls.forEach(function (url) {
                if (url && combinedUrls.indexOf(url) === -1) {
                    combinedUrls.push(url);
                }
            });
            extraUrls = combinedUrls.slice(0, 4);
        }

        if (!name || !price || !imageUrl) {
            alert("Preencha nome, preco e imagem.");
            return;
        }
        if (!categoryValue) {
            alert("Selecione uma categoria.");
            return;
        }
        if (discountPercent < 0 || discountPercent > 100) {
            alert("Informe um desconto entre 0 e 100.");
            return;
        }
        if (stockQuantity < 0) {
            alert("Informe um estoque valido.");
            return;
        }

        const id = productIdInput && productIdInput.value ? productIdInput.value : "";

        await upsertProduct({
            id: id,
            name: name,
            description: description,
            price: price,
            image_url: imageUrl,
            image_urls: extraUrls,
            discount_percent: normalizedDiscount,
            stock_quantity: stockQuantity,
            category: categoryValue,
        });
    });
}

if (productCancelBtn) {
    productCancelBtn.addEventListener("click", function () {
        resetProductForm();
    });
}
if (productImageFileInput) {
    productImageFileInput.addEventListener("change", async function () {
        const file = productImageFileInput.files && productImageFileInput.files[0];
        if (!file) {
            pendingMainImageFile = null;
            setImagePreview(currentImageUrl, productImagePreview);
            return;
        }

        const validation = await validateImageFile(file);
        if (!validation.ok) {
            alert(validation.error);
            productImageFileInput.value = "";
            pendingMainImageFile = null;
            setImagePreview(currentImageUrl, productImagePreview);
            return;
        }

        pendingMainImageFile = file;
        const reader = new FileReader();
        reader.onload = function (event) {
            const result = event.target && event.target.result ? event.target.result : "";
            setImagePreview(result, productImagePreview);
        };
        reader.readAsDataURL(file);
    });
}

if (productImagesExtraInput) {
    productImagesExtraInput.addEventListener("change", async function () {
        const files = productImagesExtraInput.files ? Array.from(productImagesExtraInput.files) : [];
        const maxExtras = Math.max(0, 4 - currentImageUrlsExtra.length);

        if (files.length > 4) {
            alert("Selecione no maximo 4 imagens extras.");
            productImagesExtraInput.value = "";
            pendingExtraImageFiles = [];
            pendingExtraImagePreviews = [];
            updateExtraPreviews();
            return;
        }

        if (!files.length) {
            pendingExtraImageFiles = [];
            pendingExtraImagePreviews = [];
            updateExtraPreviews();
            return;
        }

        if (maxExtras === 0) {
            alert("Limite de imagens extras ja atingido.");
            productImagesExtraInput.value = "";
            updateExtraPreviews();
            return;
        }

        const existingFiles = pendingExtraImageFiles.slice();
        const existingPreviews = pendingExtraImagePreviews.slice();
        const existingKeys = new Set(
            existingFiles.map(function (file) {
                return getFileKey(file);
            })
        );
        const validFiles = existingFiles.slice();
        const newFiles = [];
        const errors = [];

        for (const file of files) {
            if (existingKeys.has(getFileKey(file))) {
                continue;
            }
            const validation = await validateImageFile(file);
            if (validation.ok) {
                if (validFiles.length + newFiles.length >= maxExtras) {
                    errors.push(`${file.name}: limite de imagens extras atingido.`);
                } else {
                    newFiles.push(file);
                }
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        }

        if (errors.length) {
            alert(errors.join("\n"));
        }

        pendingExtraImageFiles = validFiles.concat(newFiles).slice(0, maxExtras);

        if (!pendingExtraImageFiles.length) {
            productImagesExtraInput.value = "";
            pendingExtraImagePreviews = existingPreviews.slice(0, maxExtras);
            updateExtraPreviews();
            return;
        }

        const readers = newFiles.map(function (file) {
            return new Promise(function (resolve) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    resolve(event.target && event.target.result ? event.target.result : "");
                };
                reader.readAsDataURL(file);
            });
        });

        const results = await Promise.all(readers);
        const previews = results
            .filter(Boolean)
            .map(function (src, index) {
                return { src: src, key: getFileKey(newFiles[index]) };
            });
        pendingExtraImagePreviews = existingPreviews.concat(previews).slice(0, maxExtras);
        updateExtraPreviews();
        productImagesExtraInput.value = "";
    });
}

if (productImageRemoveBtn) {
    productImageRemoveBtn.addEventListener("click", function () {
        pendingMainImageFile = null;
        if (productImageFileInput) {
            productImageFileInput.value = "";
        }
        if (currentImageUrl) {
            const confirmed = window.confirm("Remover imagem atual? Voce precisara escolher outra antes de salvar.");
            if (confirmed) {
                currentImageUrl = "";
            }
        }
        setImagePreview(currentImageUrl, productImagePreview);
    });
}

if (productImagesClearBtn) {
    productImagesClearBtn.addEventListener("click", function () {
        currentImageUrlsExtra = [];
        pendingExtraImageFiles = [];
        pendingExtraImagePreviews = [];
        if (productImagesExtraInput) {
            productImagesExtraInput.value = "";
        }
        updateExtraPreviews();
    });
}

if (productImagesPreview) {
    productImagesPreview.addEventListener("click", function (event) {
        const button = event.target.closest("button.admin-thumb-remove");
        if (!button) {
            return;
        }
        const source = button.dataset.source;
        const index = parseInt(button.dataset.index || "-1", 10);
        if (!Number.isFinite(index) || index < 0) {
            return;
        }

        if (source === "existing") {
            currentImageUrlsExtra.splice(index, 1);
        } else if (source === "pending") {
            pendingExtraImageFiles.splice(index, 1);
            pendingExtraImagePreviews.splice(index, 1);
        }
        updateExtraPreviews();
    });
}

if (adminProductList) {
    adminProductList.addEventListener("click", async function (event) {
        const button = event.target.closest("button[data-action]");
        if (!button) {
            return;
        }

        const item = button.closest(".admin-item");
        if (!item) {
            return;
        }

        const id = item.dataset.id;
        const product = products.find(function (current) {
            return current.id === id;
        });

        if (!product) {
            return;
        }

        if (button.dataset.action === "edit") {
            if (productIdInput) {
                productIdInput.value = product.id;
            }
            if (productNameInput) {
                productNameInput.value = product.name;
            }
            if (productPriceInput) {
                productPriceInput.value = product.price;
            }
            if (productDiscountInput) {
                productDiscountInput.value = product.discount_percent || 0;
            }
            if (productStockInput) {
                productStockInput.value = product.stock_quantity || 0;
            }
            if (productCategoryInput) {
                productCategoryInput.value = product.category || "";
            }
            if (productDescriptionInput) {
                productDescriptionInput.value = product.description;
            }
            currentImageUrl = product.image_url || product.image || "";
            currentImageUrlsExtra = getExtraImages(product);
            setImagePreview(currentImageUrl, productImagePreview);
            pendingExtraImageFiles = [];
            pendingExtraImagePreviews = [];
            updateExtraPreviews();

            if (productForm) {
                productForm.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }

        if (button.dataset.action === "remove") {
            const confirmed = window.confirm("Remover este produto?");
            if (!confirmed) {
                return;
            }

            if (!supabaseReady) {
                alert("Configure SUPABASE_URL e SUPABASE_ANON_KEY.");
                return;
            }

            const response = await supabaseClient.from("products").delete().eq("id", id);
            if (response.error) {
                alert("Erro ao remover produto.");
                return;
            }

            await fetchProducts({ updateAdminList: true });
            resetProductForm();
        }
    });
}

populateCategorySelect();
populateAdminCategoryFilter();
renderCategoryFilters();
trackAnalyticsEvent("page_view");
fetchProducts();
initAdminSession();



