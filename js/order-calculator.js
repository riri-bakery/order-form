const PRODUCT_TYPE = '꾹꾹이 쿠키 클리커';
const SINGLE_UNIT_PRICE = 45000;
const MULTI_UNIT_PRICE = 40000;
const SHIPPING_FEE = 4000;
const COLOR_CHANGE_PRICE = 3000;
const KEYRING_PRICE = 5000;

const designList = document.getElementById('designList');
const rowTemplate = document.getElementById('designRowTemplate');
const addDesignRowButton = document.getElementById('addDesignRow');
const amountDueEl = document.getElementById('amountDue');
const grossAmountEl = document.getElementById('grossAmount');
const optionAmountEl = document.getElementById('optionAmount');
const productBreakdownEl = document.getElementById('productBreakdown');
const optionBreakdownEl = document.getElementById('optionBreakdown');
const shippingAmountEl = document.getElementById('shippingAmount');
const totalQtyEl = document.getElementById('totalQty');
const summaryTextEl = document.getElementById('summaryText');
const copySummaryButton = document.getElementById('copySummary');
const resetOrderButton = document.getElementById('resetOrder');
const shippingModeInput = document.getElementById('shippingMode');
let copyLineText = '';

function won(value){
  return Math.round(value).toLocaleString('ko-KR')+'원';
}

function clampQty(value){
  const qty = Math.floor(Number(value));
  if(!Number.isFinite(qty) || qty < 1) return 1;
  return Math.min(qty, 99);
}

function clampOptionQty(value, max){
  const qty = Math.floor(Number(value));
  if(!Number.isFinite(qty) || qty < 0) return 0;
  return Math.min(qty, max);
}

function rowUnitPrice(qty){
  return qty >= 2 ? MULTI_UNIT_PRICE : SINGLE_UNIT_PRICE;
}

function getRows(){
  return Array.from(designList.querySelectorAll('.order-design-row'));
}

function readRow(row, index){
  const nameInput = row.querySelector('.design-name');
  const qtyInput = row.querySelector('.design-qty');
  const colorInput = row.querySelector('.color-qty');
  const keyringInput = row.querySelector('.keyring-qty');
  const qty = clampQty(qtyInput.value);
  const colorQty = clampOptionQty(colorInput.value, qty);
  const keyringQty = clampOptionQty(keyringInput.value, qty);
  if(String(qtyInput.value) !== String(qty)) qtyInput.value = qty;
  if(String(colorInput.value) !== String(colorQty)) colorInput.value = colorQty;
  if(String(keyringInput.value) !== String(keyringQty)) keyringInput.value = keyringQty;
  const unit = rowUnitPrice(qty);
  const productTotal = qty * unit;
  const colorTotal = colorQty * COLOR_CHANGE_PRICE;
  const keyringTotal = keyringQty * KEYRING_PRICE;
  const optionTotal = colorTotal + keyringTotal;
  const total = productTotal + optionTotal;
  const name = nameInput.value.trim() || `도안 ${index + 1}`;
  return {type: PRODUCT_TYPE, name, qty, unit, productTotal, colorQty, colorTotal, keyringQty, keyringTotal, optionTotal, total};
}

function buildCopyLine(items, shipping, due){
  let colorQty = 0;
  let colorTotal = 0;
  let keyringQty = 0;
  let keyringTotal = 0;
  const parts = items.map(item=>`${item.name} ${item.qty}개(${won(item.productTotal)})`);

  items.forEach(item=>{
    colorQty += item.colorQty;
    colorTotal += item.colorTotal;
    keyringQty += item.keyringQty;
    keyringTotal += item.keyringTotal;
  });

  if(colorTotal > 0) parts.push(`색상 변경 ${colorQty}개(${won(colorTotal)})`);
  if(keyringTotal > 0) parts.push(`키링 추가 ${keyringQty}개(${won(keyringTotal)})`);
  if(shipping > 0) parts.push(`배송비(${won(shipping)})`);
  return `${parts.join(' + ')} = 총 ${won(due)}`;
}

function buildProductBreakdown(items){
  if(!items.length) return '도안을 추가하면 주문 요약이 표시됩니다.';
  return items.map(item=>`${item.name} ${item.qty}개 ${won(item.productTotal)}`).join('\n');
}

function buildOptionBreakdown(items){
  let colorQty = 0;
  let colorTotal = 0;
  let keyringQty = 0;
  let keyringTotal = 0;

  items.forEach(item=>{
    colorQty += item.colorQty;
    colorTotal += item.colorTotal;
    keyringQty += item.keyringQty;
    keyringTotal += item.keyringTotal;
  });

  const lines = [];
  if(colorTotal > 0) lines.push(`색상 변경 ${colorQty}개 ${won(colorTotal)}`);
  if(keyringTotal > 0) lines.push(`키링 추가 ${keyringQty}개 ${won(keyringTotal)}`);
  return lines.length ? lines.join('\n') : '선택 옵션 없음';
}

function buildSummary(items, shipping, due){
  if(!items.length) return '도안을 추가하면 주문 요약이 표시됩니다.';
  copyLineText = buildCopyLine(items, shipping, due);
  return copyLineText;
}

function updateCalculator(){
  const rows = getRows();
  const items = rows.map(readRow);
  let productTotal = 0;
  let optionTotal = 0;
  let qty = 0;

  rows.forEach((row, index)=>{
    const item = items[index];
    productTotal += item.productTotal;
    optionTotal += item.optionTotal;
    qty += item.qty;
    row.querySelector('.design-total').textContent = won(item.total);
    row.querySelector('.remove-design').disabled = rows.length <= 1;
  });

  const shipping = shippingModeInput.checked ? SHIPPING_FEE : 0;
  const due = productTotal + optionTotal + shipping;
  grossAmountEl.textContent = won(productTotal);
  optionAmountEl.textContent = won(optionTotal);
  productBreakdownEl.textContent = buildProductBreakdown(items);
  optionBreakdownEl.textContent = buildOptionBreakdown(items);
  shippingAmountEl.textContent = won(shipping);
  totalQtyEl.textContent = qty.toLocaleString('ko-KR')+'개';
  amountDueEl.textContent = won(due);
  summaryTextEl.textContent = buildSummary(items, shipping, due);
  copySummaryButton.disabled = !items.length || due <= 0;
}

function addDesignRow(defaults={}){
  const fragment = rowTemplate.content.cloneNode(true);
  const row = fragment.querySelector('.order-design-row');
  row.querySelector('.design-name').value = defaults.name || '';
  row.querySelector('.design-qty').value = defaults.qty || 1;
  row.querySelector('.color-qty').value = defaults.colorQty || 0;
  row.querySelector('.keyring-qty').value = defaults.keyringQty || 0;
  row.addEventListener('input', updateCalculator);
  row.addEventListener('change', updateCalculator);
  row.querySelector('.remove-design').addEventListener('click', ()=>{
    row.remove();
    if(!getRows().length) addDesignRow();
    updateCalculator();
  });
  designList.appendChild(fragment);
  updateCalculator();
}

async function copySummary(){
  const text = copyLineText;
  if(!text || copySummaryButton.disabled) return;
  try{
    await navigator.clipboard.writeText(text);
    const original = copySummaryButton.textContent;
    copySummaryButton.textContent = '복사 완료';
    setTimeout(()=>{copySummaryButton.textContent = original;}, 1200);
  }catch(err){
    window.prompt('아래 주문 요약을 복사해 주세요.', text);
  }
}

function resetOrder(){
  designList.innerHTML = '';
  addDesignRow();
}

addDesignRowButton.addEventListener('click', ()=>addDesignRow());
copySummaryButton.addEventListener('click', copySummary);
resetOrderButton.addEventListener('click', resetOrder);
shippingModeInput.addEventListener('change', updateCalculator);

addDesignRow();
