// 全域變量，用來記錄當前選擇的商店
var currentStore = "";

console.log("網頁腳本載入完成！");

var cartTotal = 0;
var cartItems = [];

// 更新 localStorage 数据结构
function migrateProductsData(data) {
  for (var store in data) {
    if (!Array.isArray(data[store])) continue; // 避免版本号等非数组属性
    data[store].forEach(function(product) {
      if (typeof product.discount === "undefined") {
        product.discount = 0;
      }
    });
  }
  return data;
}

// 载入 localStorage 数据并迁移
productsData = migrateProductsData(productsData);

// 根據所選商店來顯示商品
// script.js

function selectStore(storeId) {
  currentStore = storeId;
  var productsSection = document.getElementById("products");
  productsSection.innerHTML = "<h2>商品展示</h2>";

  // 檢查該商店是否存在且為數組
  if (productsData[storeId] && Array.isArray(productsData[storeId])) {
    // 過濾出上架商品（isVisible 為 true）
    var visibleProducts = productsData[storeId].filter(function(product) {
      return product.isVisible;
    });
    
    visibleProducts.forEach(function(product) {
      var finalPrice = product.price * (1 - product.discount);
      var productDiv = document.createElement("div");
      productDiv.className = "product-card";
      productDiv.innerHTML = `
        <h3>${product.name}</h3>
        <p>原價：${product.price} 金幣</p>
        <p>折扣：${(product.discount * 100).toFixed(0)}%</p>
        <p>折扣後價格：${finalPrice.toFixed(2)} 金幣</p>
        <p>庫存：${product.stock}</p>
        <button onclick="addToCart(${product.id}, '${product.name}', ${finalPrice})">加入購物車</button>
        <button class="detail-btn" data-productid="${product.id}" data-store="${storeId}">查詢詳細屬性</button>
      `;
      productsSection.appendChild(productDiv);
    });
  } else {
    productsSection.innerHTML += "<p>此商店沒有商品</p>";
  }
}

// 购物车功能
function addToCart(id, name, price) {
  var product = productsData[currentStore].find(item => item.id === id);
  if (product && product.stock > 0) {
    product.stock--;
  } else {
    alert("庫存不足！");
    return;
  }
  localStorage.setItem("productsData", JSON.stringify(productsData));

  var existingItem = cartItems.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity++;
    existingItem.subtotal = existingItem.quantity * existingItem.price;
  } else {
    cartItems.push({ id, name, price, quantity: 1, subtotal: price });
  }

  cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  document.getElementById("total-amount").innerText = cartTotal;

  updateCartDisplay();
  selectStore(currentStore);
}

// 更新购物车显示
function updateCartDisplay() {
  var cartItemsDiv = document.getElementById("cart-items");
  cartItemsDiv.innerHTML = cartItems.length > 0
    ? "<ul>" + cartItems.map(item => 
      `<li>${item.name} x ${item.quantity} = ${item.subtotal} 金幣 
      <button onclick='removeFromCart(${item.id})'>刪除</button></li>`
    ).join("") + "</ul>"
    : "購物車內沒有商品。";
}

// 从购物车移除商品
function removeFromCart(productId) {
  var index = cartItems.findIndex(item => item.id === productId);
  if (index !== -1) {
    var product = productsData[currentStore].find(item => item.id === productId);
    if (product) product.stock++;
    
    cartItems[index].quantity--;
    cartItems[index].subtotal = cartItems[index].quantity * cartItems[index].price;
    if (cartItems[index].quantity <= 0)
      cartItems.splice(index, 1);
  }

  cartTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  document.getElementById("total-amount").innerText = cartTotal;
  localStorage.setItem("productsData", JSON.stringify(productsData));

  updateCartDisplay();
  selectStore(currentStore);
}

// 订单结账
function checkout() {
  if (cartItems.length === 0) {
    alert("購物車是空的，無法結帳。");
    return;
  }
  
  var orderDetails = "訂單明細:\n" + cartItems.map(item => 
    `${item.name} x ${item.quantity} = ${item.subtotal} 金幣`
  ).join("\n");
  
  alert(orderDetails + `\n總金額: ${cartTotal} 金幣`);
  
  var newOrder = { time: new Date().toLocaleString(), total: cartTotal, items: cartItems };
  var orders = JSON.parse(localStorage.getItem("orderHistory") || "[]");
  orders.push(newOrder);
  localStorage.setItem("orderHistory", JSON.stringify(orders));
  
  // 清空購物車
  cartItems = [];
  cartTotal = 0;
  document.getElementById("total-amount").innerText = cartTotal;
  updateCartDisplay();
}

// 监听商品详情按钮（使用事件代理），确保在页面加载后执行
// 监听商品详情按钮（使用事件代理），确保在页面加载后执行
document.addEventListener("DOMContentLoaded", function () {
  var productsSection = document.getElementById("products");
  if (productsSection) {
    productsSection.addEventListener("click", function (event) {
      if (event.target.classList.contains("detail-btn")) {
        var productId = event.target.getAttribute("data-productid");
        var storeName = event.target.getAttribute("data-store");
        var product = productsData[storeName]?.find(item => item.id == productId);

        var detailDiv = document.getElementById("detail-display");
        var detailContent = document.getElementById("detail-content");

        if (product && detailDiv && detailContent) {
          var details = `
            <p><strong>名稱：</strong> ${product.name}</p>
            <p><strong>類型：</strong> ${product.type || "無"}</p>
            <p><strong>傷害：</strong> ${product.damage || "無"}</p>
            <p><strong>價格：</strong> ${product.price}</p>
            <p><strong>庫存：</strong> ${product.stock}</p>
            <p><strong>描述：</strong> ${product.description || "無"}</p>
            <p><strong>特殊效果：</strong> ${product.specialEffects || "無"}</p>
          `;
          if (product.actions) {
            details += `<p><strong>動作：</strong></p><ul>`;
            for (var action in product.actions) {
              details += `<li>${action}: ${product.actions[action].description}</li>`;
            }
            details += "</ul>";
            details += `<p><em>所有動作除了特別寫明，使用一次之後，在進行短休/長休之前不能再次使用。</em></p>`;
          }
          detailContent.innerHTML = details;
          detailDiv.style.display = "block";
        } else {
          console.error("找不到詳細信息的顯示元素或商品數據！");
        }
      }
    });
  }
  
  // --- 下面添加結賬按鈕的事件綁定 ---
  var checkoutButton = document.getElementById("checkout-button");
  if (!checkoutButton) {
    console.error("找不到 ID 為 checkout-button 的按鈕！");
    return;
  }
  checkoutButton.addEventListener("click", function () {
    console.log("結賬按鈕被點擊，開始執行 checkout()");
    checkout();
  });
});
