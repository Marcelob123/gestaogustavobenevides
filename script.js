// Bancos de Dados Locais
let clientes = JSON.parse(localStorage.getItem('clientesApp')) || [];
let procedimentos = JSON.parse(localStorage.getItem('procedimentosApp')) || [];
let estoque = JSON.parse(localStorage.getItem('estoqueApp')) || []; 

// Migração: Garante que os itens de estoque tenham a propriedade quantidade
estoque = estoque.map(e => ({...e, quantidade: e.quantidade !== undefined ? e.quantidade : 0}));

let servicosRealizados = JSON.parse(localStorage.getItem('servicosRealizadosApp')) || [];
let registrosAntigos = JSON.parse(localStorage.getItem('registrosApp')) || [];
if(registrosAntigos.length > 0 && servicosRealizados.length === 0) { servicosRealizados = registrosAntigos; }

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
    
    resetarFormulariosProdutos();
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

    let receitaServicos = 0, receitaProdutos = 0, custoProdutos = 0;

    servicosMes.forEach(s => {
        receitaServicos += (parseFloat(s.valorServico) || parseFloat(s.valor) || 0); 
        if(s.produtos && s.produtos.length > 0) {
            s.produtos.forEach(prod => {
                receitaProdutos += (parseFloat(prod.venda) * parseInt(prod.qtd));
                custoProdutos += (parseFloat(prod.custo) * parseInt(prod.qtd));
            });
        } else if(s.produtoId) {
            receitaProdutos += ((parseFloat(s.produtoVenda)||0) * (parseInt(s.produtoQtd)||1));
            custoProdutos += ((parseFloat(s.produtoCusto)||0) * (parseInt(s.produtoQtd)||1));
        }
    });
    
    produtosMes.forEach(p => {
        if(p.produtos && p.produtos.length > 0) { 
            p.produtos.forEach(prod => {
                receitaProdutos += (parseFloat(prod.venda) * parseInt(prod.qtd));
                custoProdutos += (parseFloat(prod.custo) * parseInt(prod.qtd));
            });
        } else { 
            receitaProdutos += ((parseFloat(p.venda)||0) * (parseInt(p.qtd)||1));
            custoProdutos += ((parseFloat(p.custo)||0) * (parseInt(p.qtd)||1));
        }
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
        Seu negócio gerou <strong>R$ ${receitaServicos.toFixed(2).replace('.', ',')}</strong> em serviços e <strong>R$ ${receitaProdutos.toFixed(2).replace('.', ',')}</strong> em vendas. O lucro líquido real é de <strong>R$ ${lucroLiquido.toFixed(2).replace('.', ',')}</strong>.<br><br>
        <em>Para controle oficial, registre esses valores na planilha <strong>Finanças Benevides</strong>.</em>`;
}

// === GERENCIAR MODAIS E CADASTROS ===
function abrirModal(id) { 
    document.getElementById(id).classList.add('active'); 
    renderizarModais(); 
    if(id === 'modalFrequencia') renderizarClientesFrequentes(); 
}
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
    const qtd = parseInt(document.getElementById('novoEstQtd').value) || 0;
    const custo = parseFloat(document.getElementById('novoEstCusto').value);
    const venda = parseFloat(document.getElementById('novoEstVenda').value);
    
    if(nome && custo && venda) { 
        estoque.push({ id: Date.now(), nome, custo, venda, quantidade: qtd }); 
        salvarDados('estoqueApp', estoque); 
        renderizarModais(); 
    }
    
    document.getElementById('novoEstNome').value = ''; 
    document.getElementById('novoEstQtd').value = '';
    document.getElementById('novoEstCusto').value = ''; 
    document.getElementById('novoEstVenda').value = '';
}

function editarCliente(id) {
    const item = clientes.find(c => c.id === id);
    const novoNome = prompt('Editar nome do cliente:', item.nome);
    if(novoNome !== null && novoNome.trim() !== '') {
        item.nome = novoNome.trim(); salvarDados('clientesApp', clientes); renderizarModais();
    }
}
function editarProcedimento(id) {
    const item = procedimentos.find(p => p.id === id);
    const novoNome = prompt('Editar nome do serviço:', item.nome);
    if(novoNome === null) return;
    const novoValor = prompt('Editar valor (R$):', item.valor);
    if(novoValor === null) return;
    item.nome = novoNome.trim() || item.nome; item.valor = parseFloat(novoValor.replace(',', '.')) || item.valor;
    salvarDados('procedimentosApp', procedimentos); renderizarModais();
}
function editarEstoque(id) {
    const item = estoque.find(e => e.id === id);
    const novoNome = prompt('Editar Produto:', item.nome);
    if(novoNome === null) return;
    const novaQtd = prompt('Editar Quantidade em Estoque:', item.quantidade);
    if(novaQtd === null) return;
    const novoCusto = prompt('Editar Preço de Custo (R$):', item.custo);
    if(novoCusto === null) return;
    const novoVenda = prompt('Editar Preço de Venda (R$):', item.venda);
    if(novoVenda === null) return;
    
    item.nome = novoNome.trim() || item.nome;
    item.quantidade = parseInt(novaQtd) || 0;
    item.custo = parseFloat(novoCusto.replace(',', '.')) || item.custo;
    item.venda = parseFloat(novoVenda.replace(',', '.')) || item.venda;
    salvarDados('estoqueApp', estoque); renderizarModais();
}

function excluirItem(tipo, id) {
    if(!confirm('Excluir permanentemente?')) return;
    if(tipo === 'cliente') { clientes = clientes.filter(i => i.id !== id); salvarDados('clientesApp', clientes); }
    if(tipo === 'proc') { procedimentos = procedimentos.filter(i => i.id !== id); salvarDados('procedimentosApp', procedimentos); }
    if(tipo === 'est') { estoque = estoque.filter(i => i.id !== id); salvarDados('estoqueApp', estoque); }
    renderizarModais();
}

function renderizarModais() {
    document.getElementById('listaClientesModal').innerHTML = clientes.map(c => `<div class="modal-list-item"><span>${c.nome}</span><div class="modal-actions"><button class="btn-edit" onclick="editarCliente(${c.id})"><span class="material-icons">edit</span></button><button class="btn-delete" onclick="excluirItem('cliente', ${c.id})"><span class="material-icons">delete</span></button></div></div>`).join('');
    document.getElementById('listaProcedimentosModal').innerHTML = procedimentos.map(p => `<div class="modal-list-item"><div><span>${p.nome}</span><span class="detalhe">R$ ${(p.valor||0).toFixed(2)}</span></div><div class="modal-actions"><button class="btn-edit" onclick="editarProcedimento(${p.id})"><span class="material-icons">edit</span></button><button class="btn-delete" onclick="excluirItem('proc', ${p.id})"><span class="material-icons">delete</span></button></div></div>`).join('');
    
    document.getElementById('listaEstoqueModal').innerHTML = estoque.map(e => {
        const alertaEstoque = e.quantidade <= 0 ? `<span style="color:#e74c3c; font-weight:bold;"> (Esgotado)</span>` : ``;
        return `
        <div class="modal-list-item">
            <div>
                <span>${e.nome}</span>
                <span class="detalhe">Custo: R$ ${(e.custo||0).toFixed(2)} | Venda: R$ ${(e.venda||0).toFixed(2)} | Qtd: ${e.quantidade} ${alertaEstoque}</span>
            </div>
            <div class="modal-actions">
                <button class="btn-edit" onclick="editarEstoque(${e.id})"><span class="material-icons">edit</span></button>
                <button class="btn-delete" onclick="excluirItem('est', ${e.id})"><span class="material-icons">delete</span></button>
            </div>
        </div>`;
    }).join('');
}

// === SISTEMA DE MULTIPLOS PRODUTOS ===
function getOpcoesProdutosHtml() {
    return '<option value="" disabled selected>Selecione um Produto</option>' + estoque.map(e => {
        const txtEstoque = e.quantidade <= 0 ? ' [ESGOTADO]' : ` [Estoque: ${e.quantidade}]`;
        return `<option value="${e.id}">${e.nome} (R$ ${(e.venda||0).toFixed(2)})${txtEstoque}</option>`;
    }).join('');
}

function atualizarSelects() {
    document.getElementById('clienteSelect').innerHTML = '<option value="" disabled selected>Selecione o Cliente</option>' + clientes.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
    document.getElementById('procedimentoSelect').innerHTML = '<option value="" disabled selected>Selecione o Serviço</option>' + procedimentos.map(p => `<option value="${p.nome}" data-valor="${p.valor}">${p.nome}</option>`).join('');
    
    const optionsProd = getOpcoesProdutosHtml();
    document.querySelectorAll('.prod-select-dinamico').forEach(select => {
        const val = select.value; select.innerHTML = optionsProd; select.value = val;
    });
}

function preencherValorProcedimento() {
    const opt = document.getElementById('procedimentoSelect').selectedOptions[0];
    if(opt && opt.dataset.valor) document.getElementById('valorServico').value = opt.dataset.valor;
}

function adicionarLinhaProduto(tipo) {
    const container = document.getElementById(tipo === 'servico' ? 'listaProdutosServico' : 'listaProdutosAvulso');
    const div = document.createElement('div'); div.className = 'produto-row';
    div.innerHTML = `<select class="prod-select-dinamico" required>${getOpcoesProdutosHtml()}</select><input type="number" class="prod-qtd-dinamico" step="1" min="1" value="1" required placeholder="Qtd"><button type="button" class="btn-remove-row" onclick="this.parentElement.remove()"><span class="material-icons">delete</span></button>`;
    container.appendChild(div);
}

function resetarFormulariosProdutos() {
    document.getElementById('listaProdutosServico').innerHTML = '';
    document.getElementById('listaProdutosAvulso').innerHTML = '';
    adicionarLinhaProduto('avulso'); 
}

function coletarProdutosDaLista(idContainer) {
    const lista = [];
    document.getElementById(idContainer).querySelectorAll('.produto-row').forEach(row => {
        const idProd = parseInt(row.querySelector('.prod-select-dinamico').value);
        const qtd = parseInt(row.querySelector('.prod-qtd-dinamico').value) || 1;
        if(idProd) {
            const prod = estoque.find(p => p.id === idProd);
            if(prod) lista.push({ id: prod.id, nome: prod.nome, custo: prod.custo, venda: prod.venda, qtd: qtd });
        }
    });
    return lista;
}

// === REGISTROS E BAIXA NO ESTOQUE ===
formServico.addEventListener('submit', (e) => {
    e.preventDefault();
    const valorServ = parseFloat(document.getElementById('valorServico').value) || 0;
    const produtosComprados = coletarProdutosDaLista('listaProdutosServico');
    
    for(let p of produtosComprados) {
        const estoqueItem = estoque.find(es => es.id === p.id);
        if(estoqueItem && estoqueItem.quantidade < p.qtd) {
            if(!confirm(`Atenção: O produto ${estoqueItem.nome} ficará com estoque negativo. Deseja registrar mesmo assim?`)) return;
        }
    }

    let registro = {
        id: Date.now(), cliente: document.getElementById('clienteSelect').value,
        procedimento: document.getElementById('procedimentoSelect').value,
        valorServico: valorServ, data: document.getElementById('dataServico').value,
        produtos: produtosComprados, valorTotal: valorServ
    };

    registro.produtos.forEach(p => {
        registro.valorTotal += (p.venda * p.qtd);
        const estoqueItem = estoque.find(es => es.id === p.id);
        if(estoqueItem) estoqueItem.quantidade -= p.qtd;
    });
    
    servicosRealizados.push(registro); 
    salvarDados('servicosRealizadosApp', servicosRealizados);
    salvarDados('estoqueApp', estoque);
    
    formServico.reset(); document.getElementById('dataServico').valueAsDate = new Date(); 
    resetarFormulariosProdutos(); atualizarSelects(); feedbackSalvo(formServico.querySelector('.btn-primary'));
});

formProduto.addEventListener('submit', (e) => {
    e.preventDefault();
    const produtosComprados = coletarProdutosDaLista('listaProdutosAvulso');
    if(produtosComprados.length === 0) return alert('Adicione pelo menos um produto!');

    for(let p of produtosComprados) {
        const estoqueItem = estoque.find(es => es.id === p.id);
        if(estoqueItem && estoqueItem.quantidade < p.qtd) {
            if(!confirm(`Atenção: O produto ${estoqueItem.nome} ficará com estoque negativo. Deseja registrar mesmo assim?`)) return;
        }
    }

    let valorTotalVenda = 0; 
    produtosComprados.forEach(p => {
        valorTotalVenda += (p.venda * p.qtd);
        const estoqueItem = estoque.find(es => es.id === p.id);
        if(estoqueItem) estoqueItem.quantidade -= p.qtd;
    });

    vendasProdutos.push({ id: Date.now(), data: document.getElementById('dataProduto').value, produtos: produtosComprados, valorTotal: valorTotalVenda });
    salvarDados('vendasProdutosApp', vendasProdutos);
    salvarDados('estoqueApp', estoque);
    
    formProduto.reset(); document.getElementById('dataProduto').valueAsDate = new Date(); 
    resetarFormulariosProdutos(); atualizarSelects(); feedbackSalvo(formProduto.querySelector('.btn-primary'));
});

formDespesa.addEventListener('submit', (e) => {
    e.preventDefault();
    despesas.push({ id: Date.now(), desc: document.getElementById('descDespesa').value, valor: (parseFloat(document.getElementById('valorDespesa').value) || 0), data: document.getElementById('dataDespesa').value });
    salvarDados('despesasApp', despesas);
    formDespesa.reset(); document.getElementById('dataDespesa').valueAsDate = new Date(); feedbackSalvo(formDespesa.querySelector('.btn-primary'));
});

function feedbackSalvo(btn) {
    const txt = btn.innerHTML; const bg = btn.style.backgroundColor;
    btn.innerHTML = '<span class="material-icons">done_all</span> Salvo!'; btn.style.backgroundColor = '#27ae60';
    setTimeout(() => { btn.innerHTML = txt; btn.style.backgroundColor = bg; mudarAba('inicio'); }, 800);
}

// === EXPORTAR PDF E WHATSAPP ===
function gerarPDF() {
    window.print();
}

function enviarWhatsApp() {
    atualizarDashboardInicio(); 
    
    const mes = document.getElementById('mesFiltro').value;
    const lucro = document.getElementById('dashLucroLiquido').innerText;
    const recServicos = document.getElementById('dashReceitaServicos').innerText;
    const recProdutos = document.getElementById('dashReceitaProdutos').innerText;
    const despesasVal = document.getElementById('dashDespesas').innerText;
    const custoProd = document.getElementById('dashCustoProdutos').innerText;
    const lucroProd = document.getElementById('dashLucroProdutos').innerText;

    let texto = `*FECHAMENTO DO MÊS (${mes.split('-').reverse().join('/')})* ✂️📊\n\n`;
    texto += `*✂️ SERVIÇOS (CORTES)*\n`;
    texto += `Faturamento: ${recServicos}\n\n`;
    texto += `*🛒 PRODUTOS (BEBIDAS/OUTROS)*\n`;
    texto += `Faturamento: ${recProdutos}\n`;
    texto += `Custo: ${custoProd}\n`;
    texto += `Lucro Líquido Produtos: *${lucroProd}*\n\n`;
    texto += `*📉 DESPESAS DA LOJA*\n`;
    texto += `Total Saídas: ${despesasVal}\n\n`;
    texto += `*💰 LUCRO LÍQUIDO GERAL:* ${lucro}\n\n`;
    texto += `_Lembre-se de registrar estes totais na sua planilha Finanças Benevides!_`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}

// === CLIENTES FREQUENTES ===
function renderizarClientesFrequentes() {
    const lista = document.getElementById('listaFrequenciaModal'); lista.innerHTML = '';
    const contagem = {};

    servicosRealizados.forEach(s => {
        if(!s.cliente) return;
        if(!contagem[s.cliente]) contagem[s.cliente] = { nome: s.cliente, visitas: 0, gastoTotal: 0, ultimaVisita: s.data };
        
        contagem[s.cliente].visitas += 1;
        contagem[s.cliente].gastoTotal += (parseFloat(s.valorTotal) || parseFloat(s.valor) || 0);
        if (new Date(s.data) > new Date(contagem[s.cliente].ultimaVisita)) contagem[s.cliente].ultimaVisita = s.data;
    });

    const topClientes = Object.values(contagem).sort((a, b) => b.visitas - a.visitas);
    if(topClientes.length === 0) { lista.innerHTML = '<p style="text-align:center; padding:15px; color:#777;">Nenhum atendimento registrado.</p>'; return; }

    topClientes.forEach((c, index) => {
        const medalha = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
        const dataFmt = c.ultimaVisita ? c.ultimaVisita.split('-').reverse().join('/') : '--/--/----';
        lista.innerHTML += `
            <div class="modal-list-item" style="flex-direction: column; align-items: flex-start; gap: 5px; border-left: 4px solid #f39c12;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <strong style="color: #2c3e50; font-size: 1.05rem;">${medalha} ${c.nome}</strong>
                    <span style="color: #6200ea; font-weight: bold; font-size: 0.95rem;">${c.visitas} visitas</span>
                </div>
                <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.85rem; color: #6c757d;">
                    <span>Gasto: R$ ${c.gastoTotal.toFixed(2).replace('.',',')}</span>
                    <span>Última vez: ${dataFmt}</span>
                </div>
            </div>`;
    });
}

// === BACKUP E RESTAURAÇÃO ===
function exportarBackup() {
    const backup = { clientes, procedimentos, estoque, servicosRealizados, vendasProdutos, despesas };
    const a = document.createElement('a');
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
    a.download = "backup_gestao_benevides.json";
    document.body.appendChild(a); a.click(); a.remove();
}

document.getElementById('importBackup').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.clientes !== undefined) {
                localStorage.setItem('clientesApp', JSON.stringify(data.clientes));
                localStorage.setItem('procedimentosApp', JSON.stringify(data.procedimentos));
                localStorage.setItem('estoqueApp', JSON.stringify(data.estoque));
                localStorage.setItem('servicosRealizadosApp', JSON.stringify(data.servicosRealizados));
                localStorage.setItem('vendasProdutosApp', JSON.stringify(data.vendasProdutos));
                localStorage.setItem('despesasApp', JSON.stringify(data.despesas));
                alert('Backup restaurado!'); location.reload(); 
            }
        } catch (err) { alert('Arquivo inválido.'); }
    };
    reader.readAsText(file);
});

// === EXTRATO GERAL E ESTORNO DE ESTOQUE ===
mesFiltro.addEventListener('change', atualizarRelatorioLista);
filtroTipo.addEventListener('change', atualizarRelatorioLista);

function atualizarRelatorioLista() {
    const lista = document.getElementById('listaRelatorio'); lista.innerHTML = '';
    const mes = mesFiltro.value; const tipoFiltro = filtroTipo.value;
    let extrato = [];
    
    if (tipoFiltro === 'todos' || tipoFiltro === 'servico') servicosRealizados.filter(s => s.data && s.data.startsWith(mes)).forEach(s => extrato.push({...s, tipo: 'servico'}));
    if (tipoFiltro === 'todos' || tipoFiltro === 'produto') vendasProdutos.filter(p => p.data && p.data.startsWith(mes)).forEach(p => extrato.push({...p, tipo: 'produto'}));
    if (tipoFiltro === 'todos' || tipoFiltro === 'despesa') despesas.filter(d => d.data && d.data.startsWith(mes)).forEach(d => extrato.push({...d, tipo: 'despesa'}));
    
    extrato.sort((a, b) => new Date(b.data) - new Date(a.data));
    if(extrato.length === 0) { lista.innerHTML = '<p style="text-align:center; padding: 20px;">Sem movimentação correspondente.</p>'; return; }

    extrato.forEach(item => {
        const dataFmt = item.data.split('-').reverse().join('/');
        
        if(item.tipo === 'servico') {
            const valServico = parseFloat(item.valorServico) || parseFloat(item.valor) || 0;
            const valTotal = parseFloat(item.valorTotal) || parseFloat(item.valor) || 0;

            let linhaProd = '';
            if(item.produtos && item.produtos.length > 0) {
                linhaProd = item.produtos.map(p => `<p class="produto-adicional"><span class="material-icons">local_drink</span> + ${p.qtd}x ${p.nome} (R$ ${(p.venda * p.qtd).toFixed(2).replace('.',',')})</p>`).join('');
            } else if(item.produtoId) {
                linhaProd = `<p class="produto-adicional"><span class="material-icons">local_drink</span> + ${item.produtoQtd}x ${item.produtoNome} (R$ ${(item.produtoVenda * item.produtoQtd).toFixed(2).replace('.',',')})</p>`;
            }

            lista.innerHTML += `
                <div class="registro-item tipo-servico">
                    <div class="registro-info"><h4>${item.cliente}</h4><p><span class="material-icons">content_cut</span> ${item.procedimento} (R$ ${valServico.toFixed(2).replace('.',',')})</p>
                    ${linhaProd}<p><span class="material-icons">event</span> ${dataFmt}</p></div>
                    <div class="registro-valor"><span>+ R$ ${valTotal.toFixed(2).replace('.',',')}</span><button class="btn-delete" onclick="apagarRegistro('servico', ${item.id})"><span class="material-icons">delete</span></button></div>
                </div>`;
                
        } else if(item.tipo === 'produto') {
            let descProdutos = '', total = item.valorTotal || 0;
            if(item.produtos && item.produtos.length > 0) {
                descProdutos = item.produtos.map(p => `<p class="produto-adicional"><span class="material-icons">shopping_bag</span> ${p.qtd}x ${p.nome}</p>`).join('');
            } else {
                descProdutos = `<p class="produto-adicional"><span class="material-icons">shopping_bag</span> ${item.qtd}x ${item.nome}</p>`;
                total = (parseFloat(item.venda)||0) * (parseInt(item.qtd)||1);
            }
            
            lista.innerHTML += `
                <div class="registro-item tipo-produto">
                    <div class="registro-info"><h4>Venda Avulsa</h4>${descProdutos}<p><span class="material-icons">event</span> ${dataFmt}</p></div>
                    <div class="registro-valor"><span>+ R$ ${total.toFixed(2).replace('.',',')}</span><button class="btn-delete" onclick="apagarRegistro('produto', ${item.id})"><span class="material-icons">delete</span></button></div>
                </div>`;
            
        } else if(item.tipo === 'despesa') {
            lista.innerHTML += `<div class="registro-item tipo-despesa"><div class="registro-info"><h4>Despesa</h4><p><span class="material-icons">receipt_long</span> ${item.desc}</p><p><span class="material-icons">event</span> ${dataFmt}</p></div><div class="registro-valor"><span>- R$ ${(parseFloat(item.valor)||0).toFixed(2).replace('.',',')}</span><button class="btn-delete" onclick="apagarRegistro('despesa', ${item.id})"><span class="material-icons">delete</span></button></div></div>`;
        }
    });
}

function apagarRegistro(tipo, id) {
    if(!confirm('Deseja excluir do histórico? (Isso devolverá o produto ao estoque)')) return;
    
    if(tipo === 'servico') { 
        const servico = servicosRealizados.find(i => i.id === id);
        if(servico) {
            if(servico.produtos) {
                servico.produtos.forEach(p => {
                    const estoqueItem = estoque.find(es => es.id === p.id);
                    if(estoqueItem) estoqueItem.quantidade += p.qtd;
                });
            } else if(servico.produtoId) {
                const estoqueItem = estoque.find(es => es.id === servico.produtoId);
                if(estoqueItem) estoqueItem.quantidade += (servico.produtoQtd || 1);
            }
        }
        servicosRealizados = servicosRealizados.filter(i => i.id !== id); 
        salvarDados('servicosRealizadosApp', servicosRealizados); 
        salvarDados('estoqueApp', estoque);
    }
    
    if(tipo === 'produto') { 
        const venda = vendasProdutos.find(i => i.id === id);
        if(venda) {
            if(venda.produtos) {
                venda.produtos.forEach(p => {
                    const estoqueItem = estoque.find(es => es.id === p.id);
                    if(estoqueItem) estoqueItem.quantidade += p.qtd;
                });
            } else {
                const estoqueItem = estoque.find(es => es.nome === venda.nome);
                if(estoqueItem) estoqueItem.quantidade += (venda.qtd || 1);
            }
        }
        vendasProdutos = vendasProdutos.filter(i => i.id !== id); 
        salvarDados('vendasProdutosApp', vendasProdutos); 
        salvarDados('estoqueApp', estoque);
    }
    
    if(tipo === 'despesa') { 
        despesas = despesas.filter(i => i.id !== id); 
        salvarDados('despesasApp', despesas); 
    }
    
    atualizarSelects();
    atualizarRelatorioLista(); 
    atualizarDashboardInicio();
}
