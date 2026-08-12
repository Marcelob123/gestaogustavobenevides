// Bancos de Dados Locais
let clientes = JSON.parse(localStorage.getItem('clientesApp')) || [];
let procedimentos = JSON.parse(localStorage.getItem('procedimentosApp')) || [];
let estoque = JSON.parse(localStorage.getItem('estoqueApp')) || []; 

let servicosRealizados = JSON.parse(localStorage.getItem('servicosRealizadosApp')) || [];
// Suporte para registros muito antigos caso existam
let registrosAntigos = JSON.parse(localStorage.getItem('registrosApp')) || [];
if(registrosAntigos.length > 0 && servicosRealizados.length === 0) {
    servicosRealizados = registrosAntigos;
}

let vendasProdutos = JSON.parse(localStorage.getItem('vendasProdutosApp')) || [];
let despesas = JSON.parse(localStorage.getItem('despesasApp')) || [];

// Elementos Globais
const formServico = document.getElementById('formServico');
const formProduto = document.getElementById('formProduto');
const formDespesa = document.getElementById('formDespesa');
const mesFiltro = document.getElementById('mesFiltro');
const filtroTipo = document.getElementById('filtroTipo');

window.onload = () => {
    document.getElementById('dataServico').valueAsDate = new Date();
    document.getElementById('dataProduto').valueAsDate = new Date();
    document.getElementById('dataDespesa').valueAsDate = new Date();
    mesFiltro.value = new Date().toISOString().slice(0, 7);
    
    atualizarSelects();
    atualizarDashboardInicio();
};

function mudarAba(aba) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`screen-${aba}`).classList.add('active');
    document.getElementById(`nav-${aba}`).classList.add('active');
    
    if(aba === 'inicio') atualizarDashboardInicio();
    if(aba === 'relatorio') atualizarRelatorioLista();
}

// === MATEMÁTICA DO DASHBOARD ===
function atualizarDashboardInicio() {
    const mes = mesFiltro.value || new Date().toISOString().slice(0, 7);
    
    const servicosMes = servicosRealizados.filter(s => s.data && s.data.startsWith(mes));
    const produtosMes = vendasProdutos.filter(p => p.data && p.data.startsWith(mes));
    const despesasMes = despesas.filter(d => d.data && d.data.startsWith(mes));

    let receitaServicos = 0;
    let receitaProdutos = 0;
    let custoProdutos = 0;

    servicosMes.forEach(s => {
        // TRAVA DE SEGURANÇA: Lê o valor antigo ou o novo
        const valServico = parseFloat(s.valorServico) || parseFloat(s.valor) || 0;
        receitaServicos += valServico; 
        
        if(s.produtoId) {
            const venda = parseFloat(s.produtoVenda) || 0;
            const custo = parseFloat(s.produtoCusto) || 0;
            const qtd = parseInt(s.produtoQtd) || 1;
            receitaProdutos += (venda * qtd);
            custoProdutos += (custo * qtd);
        }
    });
    
    produtosMes.forEach(p => {
        const venda = parseFloat(p.venda) || 0;
        const custo = parseFloat(p.custo) || 0;
        const qtd = parseInt(p.qtd) || 1;
        receitaProdutos += (venda * qtd);
        custoProdutos += (custo * qtd);
    });

    let lucroProdutos = receitaProdutos - custoProdutos;
    let totalDespesas = despesasMes.reduce((acc, d) => acc + (parseFloat(d.valor) || 0), 0);
    let lucroLiquido = receitaServicos + lucroProdutos - totalDespesas;

    document.getElementById('dashReceitaServicos').textContent = `+ R$ ${receitaServicos.toFixed(2).replace('.', ',')}`;
    document.getElementById('dashReceitaProdutos').textContent = `+ R$ ${receitaProdutos.toFixed(2).replace('.', ',')}`;
    document.getElementById('dashCustoProdutos').textContent = `- R$ ${custoProdutos.toFixed(2).replace('.', ',')}`;
    document.getElementById('dashDespesas').textContent = `- R$ ${totalDespesas.toFixed(2).replace('.', ',')}`;
    document.getElementById('dashLucroProdutos').textContent = `R$ ${lucroProdutos.toFixed(2).replace('.', ',')}`;
    
    const elLucro = document.getElementById('dashLucroLiquido');
    elLucro.textContent = `R$ ${lucroLiquido.toFixed(2).replace('.', ',')}`;
    elLucro.parentElement.style.background = lucroLiquido >= 0 ? "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" : "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)";

    document.getElementById('textoRelatorioMensal').innerHTML = `
        Seu negócio gerou <strong>R$ ${receitaServicos.toFixed(2).replace('.', ',')}</strong> em serviços e <strong>R$ ${receitaProdutos.toFixed(2).replace('.', ',')}</strong> em vendas de produtos.<br><br>
        O lucro líquido real, já tirando as despesas e o custo dos produtos, é de <strong>R$ ${lucroLiquido.toFixed(2).replace('.', ',')}</strong>.`;
}

// === GERENCIAR MODAIS E CADASTROS ===
function abrirModal(id) { document.getElementById(id).classList.add('active'); renderizarModais(); }
function fecharModal(id) { document.getElementById(id).classList.remove('active'); atualizarSelects(); }
function salvarDados(chave, dados) { localStorage.setItem(chave, JSON.stringify(dados)); }

function adicionarCliente() {
    const nome = document.getElementById('novoClienteNome').value.trim();
    if(nome) { clientes.push({ id: Date.now(), nome }); salvarDados('clientesApp', clientes); renderizarModais(); }
    document.getElementById('novoClienteNome').value = '';
}
function adicionarProcedimento() {
    const nome = document.getElementById('novoProcNome').value.trim();
    const valor = parseFloat(document.getElementById('novoProcValor').value);
    if(nome && valor) { procedimentos.push({ id: Date.now(), nome, valor }); salvarDados('procedimentosApp', procedimentos); renderizarModais(); }
    document.getElementById('novoProcNome').value = ''; document.getElementById('novoProcValor').value = '';
}
function adicionarEstoque() {
    const nome = document.getElementById('novoEstNome').value.trim();
    const custo = parseFloat(document.getElementById('novoEstCusto').value);
    const venda = parseFloat(document.getElementById('novoEstVenda').value);
    if(nome && custo && venda) { estoque.push({ id: Date.now(), nome, custo, venda }); salvarDados('estoqueApp', estoque); renderizarModais(); }
    document.getElementById('novoEstNome').value = ''; document.getElementById('novoEstCusto').value = ''; document.getElementById('novoEstVenda').value = '';
}

function excluirItem(tipo, id) {
    if(!confirm('Excluir este item permanentemente?')) return;
    if(tipo === 'cliente') { clientes = clientes.filter(i => i.id !== id); salvarDados('clientesApp', clientes); }
    if(tipo === 'proc') { procedimentos = procedimentos.filter(i => i.id !== id); salvarDados('procedimentosApp', procedimentos); }
    if(tipo === 'est') { estoque = estoque.filter(i => i.id !== id); salvarDados('estoqueApp', estoque); }
    renderizarModais();
}

function renderizarModais() {
    document.getElementById('listaClientesModal').innerHTML = clientes.map(c => `<div class="modal-list-item"><span>${c.nome}</span><button class="btn-delete" onclick="excluirItem('cliente', ${c.id})"><span class="material-icons">delete</span></button></div>`).join('');
    document.getElementById('listaProcedimentosModal').innerHTML = procedimentos.map(p => `<div class="modal-list-item"><div><span>${p.nome}</span><span class="detalhe">R$ ${(p.valor||0).toFixed(2)}</span></div><button class="btn-delete" onclick="excluirItem('proc', ${p.id})"><span class="material-icons">delete</span></button></div>`).join('');
    document.getElementById('listaEstoqueModal').innerHTML = estoque.map(e => `<div class="modal-list-item"><div><span>${e.nome}</span><span class="detalhe">Custo: R$ ${(e.custo||0).toFixed(2)} | Venda: R$ ${(e.venda||0).toFixed(2)}</span></div><button class="btn-delete" onclick="excluirItem('est', ${e.id})"><span class="material-icons">delete</span></button></div>`).join('');
}

function atualizarSelects() {
    document.getElementById('clienteSelect').innerHTML = '<option value="" disabled selected>Selecione o Cliente</option>' + clientes.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
    document.getElementById('procedimentoSelect').innerHTML = '<option value="" disabled selected>Selecione o Serviço</option>' + procedimentos.map(p => `<option value="${p.nome}" data-valor="${p.valor}">${p.nome}</option>`).join('');
    
    const optionsProduto = estoque.map(e => `<option value="${e.id}">${e.nome} (R$ ${(e.venda||0).toFixed(2)})</option>`).join('');
    document.getElementById('produtoSelect').innerHTML = '<option value="" disabled selected>Selecione o Produto</option>' + optionsProduto;
    document.getElementById('produtoServicoSelect').innerHTML = '<option value="" selected>Nenhum produto</option>' + optionsProduto;
}

function preencherValorProcedimento() {
    const opt = document.getElementById('procedimentoSelect').selectedOptions[0];
    if(opt && opt.dataset.valor) document.getElementById('valorServico').value = opt.dataset.valor;
}

// === REGISTRAR MOVIMENTAÇÕES ===
formServico.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const valorServ = parseFloat(document.getElementById('valorServico').value) || 0;
    
    let registro = {
        id: Date.now(),
        cliente: document.getElementById('clienteSelect').value,
        procedimento: document.getElementById('procedimentoSelect').value,
        valorServico: valorServ,
        data: document.getElementById('dataServico').value,
        valorTotal: valorServ
    };

    const produtoIdSelecionado = document.getElementById('produtoServicoSelect').value;
    if(produtoIdSelecionado) {
        const prod = estoque.find(p => p.id === parseInt(produtoIdSelecionado));
        if(prod) {
            const qtd = parseInt(document.getElementById('qtdProdutoServico').value) || 1;
            registro.produtoId = prod.id;
            registro.produtoNome = prod.nome;
            registro.produtoVenda = prod.venda;
            registro.produtoCusto = prod.custo;
            registro.produtoQtd = qtd;
            registro.valorTotal += (prod.venda * qtd); 
        }
    }

    servicosRealizados.push(registro);
    salvarDados('servicosRealizadosApp', servicosRealizados);
    
    formServico.reset(); 
    document.getElementById('dataServico').valueAsDate = new Date(); 
    document.getElementById('qtdProdutoServico').value = 1;
    atualizarSelects();
    feedbackSalvo(formServico.querySelector('.btn-primary'));
});

formProduto.addEventListener('submit', (e) => {
    e.preventDefault();
    const idProd = parseInt(document.getElementById('produtoSelect').value);
    const prod = estoque.find(p => p.id === idProd);
    if(prod) {
        const qtd = parseInt(document.getElementById('qtdProduto').value) || 1;
        vendasProdutos.push({ id: Date.now(), nome: prod.nome, custo: prod.custo, venda: prod.venda, qtd: qtd, data: document.getElementById('dataProduto').value });
        salvarDados('vendasProdutosApp', vendasProdutos);
    }
    formProduto.reset(); document.getElementById('dataProduto').valueAsDate = new Date(); document.getElementById('qtdProduto').value = 1; atualizarSelects();
    feedbackSalvo(formProduto.querySelector('.btn-primary'));
});

formDespesa.addEventListener('submit', (e) => {
    e.preventDefault();
    const valorDesc = parseFloat(document.getElementById('valorDespesa').value) || 0;
    despesas.push({ id: Date.now(), desc: document.getElementById('descDespesa').value, valor: valorDesc, data: document.getElementById('dataDespesa').value });
    salvarDados('despesasApp', despesas);
    formDespesa.reset(); document.getElementById('dataDespesa').valueAsDate = new Date();
    feedbackSalvo(formDespesa.querySelector('.btn-primary'));
});

function feedbackSalvo(btn) {
    const txt = btn.innerHTML; const bg = btn.style.backgroundColor;
    btn.innerHTML = '<span class="material-icons">done_all</span> Salvo!'; btn.style.backgroundColor = '#27ae60';
    setTimeout(() => { btn.innerHTML = txt; btn.style.backgroundColor = bg; mudarAba('inicio'); }, 800);
}

// === EXTRATO GERAL COM FILTROS ===
mesFiltro.addEventListener('change', atualizarRelatorioLista);
filtroTipo.addEventListener('change', atualizarRelatorioLista);

function atualizarRelatorioLista() {
    const lista = document.getElementById('listaRelatorio'); 
    lista.innerHTML = '';
    const mes = mesFiltro.value;
    const tipoFiltro = filtroTipo.value;
    
    let extrato = [];
    
    if (tipoFiltro === 'todos' || tipoFiltro === 'servico') {
        servicosRealizados.filter(s => s.data && s.data.startsWith(mes)).forEach(s => extrato.push({...s, tipo: 'servico'}));
    }
    if (tipoFiltro === 'todos' || tipoFiltro === 'produto') {
        vendasProdutos.filter(p => p.data && p.data.startsWith(mes)).forEach(p => extrato.push({...p, tipo: 'produto'}));
    }
    if (tipoFiltro === 'todos' || tipoFiltro === 'despesa') {
        despesas.filter(d => d.data && d.data.startsWith(mes)).forEach(d => extrato.push({...d, tipo: 'despesa'}));
    }
    
    extrato.sort((a, b) => new Date(b.data) - new Date(a.data));

    if(extrato.length === 0) { lista.innerHTML = '<p style="text-align:center; padding: 20px;">Sem movimentação correspondente.</p>'; return; }

    extrato.forEach(item => {
        const dataFmt = item.data.split('-').reverse().join('/');
        
        if(item.tipo === 'servico') {
            // TRAVA: Usa valores antigos caso existam
            const valServico = parseFloat(item.valorServico) || parseFloat(item.valor) || 0;
            const valTotal = parseFloat(item.valorTotal) || parseFloat(item.valor) || 0;

            const linhaProdutoInfo = item.produtoId 
                ? `<p class="produto-adicional"><span class="material-icons">local_drink</span> + ${item.produtoQtd}x ${item.produtoNome} (R$ ${(item.produtoVenda * item.produtoQtd).toFixed(2).replace('.',',')})</p>` 
                : '';

            lista.innerHTML += `
                <div class="registro-item tipo-servico">
                    <div class="registro-info">
                        <h4>${item.cliente}</h4>
                        <p><span class="material-icons">content_cut</span> ${item.procedimento} (R$ ${valServico.toFixed(2).replace('.',',')})</p>
                        ${linhaProdutoInfo}
                        <p><span class="material-icons">event</span> ${dataFmt}</p>
                    </div>
                    <div class="registro-valor">
                        <span>+ R$ ${valTotal.toFixed(2).replace('.',',')}</span>
                        <button class="btn-delete" onclick="apagarRegistro('servico', ${item.id})"><span class="material-icons">delete</span></button>
                    </div>
                </div>`;
                
        } else if(item.tipo === 'produto') {
            const total = (parseFloat(item.venda)||0) * (parseInt(item.qtd)||1);
            lista.innerHTML += `<div class="registro-item tipo-produto"><div class="registro-info"><h4>Venda Avulsa: ${item.nome}</h4><p><span class="material-icons">shopping_bag</span> Qtd: ${item.qtd} un.</p><p><span class="material-icons">event</span> ${dataFmt}</p></div><div class="registro-valor"><span>+ R$ ${total.toFixed(2).replace('.',',')}</span><button class="btn-delete" onclick="apagarRegistro('produto', ${item.id})"><span class="material-icons">delete</span></button></div></div>`;
            
        } else if(item.tipo === 'despesa') {
            const valDespesa = parseFloat(item.valor)||0;
            lista.innerHTML += `<div class="registro-item tipo-despesa"><div class="registro-info"><h4>Despesa</h4><p><span class="material-icons">receipt_long</span> ${item.desc}</p><p><span class="material-icons">event</span> ${dataFmt}</p></div><div class="registro-valor"><span>- R$ ${valDespesa.toFixed(2).replace('.',',')}</span><button class="btn-delete" onclick="apagarRegistro('despesa', ${item.id})"><span class="material-icons">delete</span></button></div></div>`;
        }
    });
}

function apagarRegistro(tipo, id) {
    if(!confirm('Deseja excluir este registro do histórico?')) return;
    if(tipo === 'servico') { servicosRealizados = servicosRealizados.filter(i => i.id !== id); salvarDados('servicosRealizadosApp', servicosRealizados); }
    if(tipo === 'produto') { vendasProdutos = vendasProdutos.filter(i => i.id !== id); salvarDados('vendasProdutosApp', vendasProdutos); }
    if(tipo === 'despesa') { despesas = despesas.filter(i => i.id !== id); salvarDados('despesasApp', despesas); }
    atualizarRelatorioLista(); atualizarDashboardInicio();
}