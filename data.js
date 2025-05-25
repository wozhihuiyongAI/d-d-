// 1. 讀取 localStorage 中的數據，若無則為 null
var storedData = localStorage.getItem("productsData")
  ? JSON.parse(localStorage.getItem("productsData"))
  : null;

// 2. 預設數據
var defaultProductsData = {
  version: 5, // 当前数据的版本号
  "weapon-store": [
    {
      id: 1,
      name: "玄鐵劍",
      type: "長劍",
      damage: "1d8劈砍傷害",
      price: 100,
      stock: 5,
      discount: 0,
      description: "通體漆黑的武器，不會被火焰燒毀。",
      specialEffects:
        "對目標造成傷害時，需要進行一次DC10的體質豁免，失敗則受到1d4的心靈傷害。",
      actions: {
        "點火": {
          description:
            "通過敲擊武器或者是點火石啟動，劍身變得通紅。攻擊時，額外造成1d4的火焰傷害。"
        }
      }
    },
    {
      id: 2,
      name: "戰斧",
      price: 120,
      stock: 3,
      discount: 0
    }
  ],
  "potion-store": [
    { id: 3, name: "基礎藥水", price: 50, stock: 10, discount: 0 },
    { id: 4, name: "魔力藥水", price: 70, stock: 7, discount: 0 }
  ],
  "magic-store": [
    { id: 5, name: "魔法杖", price: 200, stock: 2, discount: 0 },
    { id: 6, name: "咒語書", price: 150, stock: 4, discount: 0 }
  ]
};

// 3. 定義合併函數：將預設數據與 localStorage 中的數據合併
function mergeProductData(defaultData, storedData) {
  if (!storedData.version || storedData.version < defaultData.version) {
    storedData.version = defaultData.version;
  }
  for (var store in defaultData) {
    if (store === "version") continue;
    if (!storedData.hasOwnProperty(store) || !Array.isArray(storedData[store])) {
      storedData[store] = defaultData[store];
    } else {
      defaultData[store].forEach(function (defaultItem) {
        var exists = storedData[store].some(function (item) {
          return item.id === defaultItem.id;
        });
        if (!exists) {
          storedData[store].push(defaultItem);
        }
      });
    }
  }
  return storedData;
}

// 4. 合併數據
if (!storedData) {
  storedData = defaultProductsData;
} else {
  storedData = mergeProductData(defaultProductsData, storedData);
}

// 5. 從合併後的 storedData 中僅提取陣列屬性，確保版本號不進入 productsData
var productsData = {};
for (var key in storedData) {
  if (Array.isArray(storedData[key])) {
    productsData[key] = storedData[key];
  }
}

// 6. 定義去重函數（多維度比較：根據 name、price 和 stock 判斷是否重複）
function deduplicateProducts(productsArray) {
  return productsArray.filter(function (product, index, self) {
    return index === self.findIndex(function (item) {
      return (
        item.name === product.name &&
        item.price === product.price &&
        item.stock === product.stock
      );
    });
  });
}

// 7. 針對每個商店的產品數組執行去重
for (var store in productsData) {
  if (Array.isArray(productsData[store])) {
    productsData[store] = deduplicateProducts(productsData[store]);
  }
}

// 8. 將最終數據存入 localStorage（初始化階段存一遍）
localStorage.setItem("productsData", JSON.stringify(productsData));

/* ---------- 以下為與 DOM 相關的部分 ---------- */
document.addEventListener("DOMContentLoaded", function () {
  // 嘗試獲取新增商品的表單元素
  var addProductForm = document.getElementById("add-product-form");
  if (!addProductForm) {
    console.error("找不到 ID 為 add-product-form 的表單！");
    // 如果該表單僅在管理頁面中存在，而目前頁面不包含它，
    // 則可以選擇直接返回，不影響其它功能
    return;
  }
  
  var isSubmitting = false;
  
  addProductForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    
    console.log("新增產品事件處理器被觸發，開始提交");
    
    var store = document.getElementById("product-store").value;
    var name = document.getElementById("product-name").value;
    var price = parseFloat(document.getElementById("product-price").value);
    var stock = parseInt(document.getElementById("product-stock").value, 10);
    var discount = parseFloat(document.getElementById("product-discount").value);
    var description = document.getElementById("product-description").value;
    
    var newProduct = {
      id: Date.now(),
      name: name,
      price: price,
      stock: stock,
      discount: discount,
      description: description,
      isVisible: true  // 新增時默認設定為上架
    };
    
    // 確保該商店的數據存在
    if (!productsData[store] || !Array.isArray(productsData[store])) {
      productsData[store] = [];
    }
    
    productsData[store].push(newProduct);
    localStorage.setItem("productsData", JSON.stringify(productsData));
    alert("商品新增成功！");
    
    addProductForm.reset();
    if (typeof updateAdminProductList === "function") {
      updateAdminProductList();
    }
    
    isSubmitting = false;
  });
});