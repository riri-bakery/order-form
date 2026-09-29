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
const shippingAmountEl = document.getElementById('shippingAmount');
const totalQtyEl = document.getElementById('totalQty');
const summaryTextEl = document.getElementById('summaryText');
const copySummaryButton = document.getElementById('copySummary');
const resetOrderButton = document.getElementById('resetOrder');
const shippingModeInput = document.getElementById('shippingMode');

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

function buildSummary(items, productTotal, optionTotal, shipping, due){
  if(!items.length) return '도안을 추가하면 주문 요약이 표시됩니다.';
  const lines = items.map((item, index)=>{
    const options = [];
    if(item.colorQty) options.push(`색상 변경 ${item.colorQty}개`);
    if(item.keyringQty) options.push(`키링 ${item.keyringQty}개`);
    const optionText = options.length ? ` · ${options.join(' · ')}` : '';
    return `${index + 1}. ${item.type} · ${item.name} · 제작 ${item.qty}개${optionText} = ${won(item.total)}`;
  });
  lines.push(`총 제작 금액: ${won(productTotal)}`);
  lines.push(`옵션 금액: ${won(optionTotal)}`);
  lines.push(`배송비: ${won(shipping)}`);
  lines.push(`받을 금액: ${won(due)}`);
  return lines.join('\n');
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
  shippingAmountEl.textContent = won(shipping);
  totalQtyEl.textContent = qty.toLocaleString('ko-KR')+'개';
  amountDueEl.textContent = won(due);
  summaryTextEl.textContent = buildSummary(items, productTotal, optionTotal, shipping, due);
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
  const text = summaryTextEl.textContent;
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
