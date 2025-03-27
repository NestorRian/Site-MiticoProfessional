let count = 1;
document.getElementById("radio1").checked = true;

setInterval(function () {
    nextImage();
}, 5000);

function nextImage() {
    count++;
    if (count > 5) {
        count = 1;
    }
    document.getElementById("radio" + count).checked = true;
}

// Obtenha o ícone de menu e o menu
const menuToggle = document.getElementById('menu-toggle');
const menu = document.querySelector('.cabecalho ul');
const menuItems = document.querySelectorAll('.cabecalho a');


document.addEventListener("DOMContentLoaded", function () {
    let whatsappButton = document.querySelector(".whatsapp-float");

    window.addEventListener("scroll", function () {
        if (window.scrollY > 100) {
            whatsappButton.style.display = "block";
        } else {
            whatsappButton.style.display = "none";
        }
    });
});

// Função para abrir/fechar o menu
menuToggle.addEventListener('click', () => {
    menu.classList.toggle('show');
});

// Fecha o menu se o usuário clicar fora dele
window.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && !menuToggle.contains(event.target)) {
        menu.classList.remove('show');
    }
});

// Fecha o menu ao clicar em uma opção
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menu.classList.remove('show');
    });
});

const cart = [];
const cartItemsList = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');

function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCart();
}

function updateCart() {
    cartItemsList.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${item.name} (x${item.quantity}) - R$ ${(item.price * item.quantity).toFixed(2)}
            <button onclick="removeFromCart(${index})">Remover</button>
        `;
        cartItemsList.appendChild(listItem);
        total += item.price * item.quantity;
    });

    cartTotal.textContent = `R$ ${total.toFixed(2)}`;
}

function removeFromCart(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
    } else {
        cart.splice(index, 1);
    }
    updateCart();
}

function finalizePurchase() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio.');
        return;
    }

    const whatsappNumber = '5511970618002';
    const orderDetails = cart
        .map(item => `${item.name} (x${item.quantity}) - R$ ${(item.price * item.quantity).toFixed(2)}`)
        .join('\n');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const message = encodeURIComponent(
        `Olá, gostaria de finalizar a compra dos seguintes itens:\n\n${orderDetails}\n\nTotal: R$ ${total.toFixed(2)}`
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(whatsappUrl, '_blank');
}

function filterProducts() {
    let input = document.getElementById("searchBar").value.toLowerCase();
    let products = document.querySelectorAll(".product-card");

    products.forEach(product => {
        let title = product.querySelector("h3").innerText.toLowerCase();
        if (title.includes(input)) {
            product.style.display = "block"; // Mostra os produtos que correspondem
        } else {
            product.style.display = "none"; // Oculta os produtos que não correspondem
        }
    });
}


// Notificação ao adicionar ao carrinho
const buttons = document.querySelectorAll(".addAlert");

buttons.forEach(button => {
    button.onclick = function () { // Alterado de addEventListener para onclick
        const prodNome = button.getAttribute("select-produto");
        const prodPreco = parseFloat(button.getAttribute("select-preco"));

        console.log(`Adicionando: ${prodNome}, Preço: ${prodPreco}`); // Debug para verificar chamadas duplas



        addToCart(prodNome, prodPreco); // Garante que o produto seja adicionado corretamente

        const notification = document.getElementById("cartNotification");

        // Limpa qualquer notificação anterior antes de adicionar uma nova
        notification.innerHTML = '';

        // Adiciona o texto da notificação
        const text = document.createElement("span");
        text.textContent = `${prodNome} adicionado ao carrinho com sucesso!`;
        notification.appendChild(text);

        // Criar botão "Ir para o Carrinho"
        let goToCartBtn = document.createElement("button");
        goToCartBtn.textContent = "Ir para o Carrinho";
        goToCartBtn.style.cssText = "margin-left: 10px; padding: 5px 10px; background-color: #007bff; color: white; border: none; cursor: pointer; border-radius: 5px;";
        
        goToCartBtn.onclick = function () {
            document.getElementById("cart").scrollIntoView({ behavior: "smooth" });
        };

        notification.appendChild(goToCartBtn);
        notification.style.display = "block";

        setTimeout(() => {
            notification.style.display = "none";
        }, 3000);
    };
});
