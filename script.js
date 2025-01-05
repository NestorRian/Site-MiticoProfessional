let count = 1;
document.getElementById("radio1").checked = true;

setInterval(function () {
    nextImage();
}, 5000)

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

// Função para abrir/fechar o menu
menuToggle.addEventListener('click', () => {
    menu.classList.toggle('show'); // Alterna a classe 'show' para exibir/ocultar o menu
});

// Fecha o menu se o usuário clicar fora dele
window.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && !menuToggle.contains(event.target)) {
        menu.classList.remove('show'); // Remove a classe 'show' se o clique for fora do menu
    }
});

// Fecha o menu ao clicar em uma opção
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menu.classList.remove('show'); // Remove a classe 'show' ao clicar em um item de menu
    });
});


const cart = [];
const cartItemsList = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');

function addToCart(name, price) {
    cart.push({ name, price });
    updateCart();
}

function updateCart() {
    cartItemsList.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
      ${item.name} - R$ ${item.price.toFixed(2)}
      <button onclick="removeFromCart(${index})">Remover</button>
    `;
        cartItemsList.appendChild(listItem);
        total += item.price;
    });

    cartTotal.textContent = `R$ ${total.toFixed(2)}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function finalizePurchase() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio.');
        return;
    }

    const whatsappNumber = '5511970618002';
    const orderDetails = cart
        .map(item => `${item.name} - R$ ${item.price.toFixed(2)}`)
        .join('\n');
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const message = encodeURIComponent(
        `Olá, gostaria de finalizar a compra dos seguintes itens:\n\n${orderDetails}\n\nTotal: R$ ${total.toFixed(2)}`
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(whatsappUrl, '_blank');
}

const buttons = document.querySelectorAll(".addAlert");

buttons.forEach(button => {
    button.addEventListener("click", function() {
        const prodNome = button.getAttribute("select-produto");

        // Exibe a notificação com o nome do produto
        const notification = document.getElementById("cartNotification");
        notification.textContent = (`${prodNome} adicionado ao carrinho com sucesso !!!`);
        notification.style.display = "block";

        // Faz com que a notificação suma após 3 segundos
        setTimeout(function() {
            notification.style.display = "none";
        }, 3000);
    });
});

