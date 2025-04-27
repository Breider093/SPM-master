// Función para cargar el menú lateral
function loadSidebar() {
    const sidebarHTML = `
        <section class="full-box nav-lateral">
            <div class="full-box nav-lateral-bg show-nav-lateral"></div>
            <div class="full-box nav-lateral-content">
                <figure class="full-box nav-lateral-avatar">
                    <i class="far fa-times-circle show-nav-lateral"></i>
                    <img src="./assets/avatar/Avatar.png" class="img-fluid" alt="Avatar">
                    <figcaption class="roboto-medium text-center">
                        Rubén Sarmiento <br><small class="roboto-condensed-light">Chief Executive Officer</small>
                    </figcaption>
                </figure>
                <div class="full-box nav-lateral-bar"></div>
                <nav class="full-box nav-lateral-menu">
                    <ul>
                        <li>
                            <a href="home.html"><i class="fab fa-dashcube fa-fw"></i> &nbsp; Dashboard</a>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-users fa-fw"></i> &nbsp; Clientes <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="client-new.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Agregar Cliente</a>
                                </li>
                                <li>
                                    <a href="client-list.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Lista de clientes</a>
                                </li>
                                <li>
                                    <a href="client-search.html"><i class="fas fa-search fa-fw"></i> &nbsp; Buscar cliente</a>
                                </li>
                                <li>
                                    <a href="cliente-saldo.html"><i class="fas fa-dollar-sign fa-fw"></i> &nbsp; Consultar saldo</a>
                                </li>
                                <li>
                                    <a href="cliente-kardex.html"><i class="fas fa-file-invoice-dollar fa-fw"></i> &nbsp; Kardex</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-box fa-fw"></i> &nbsp; Producto <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="producto-vincular.html"><i class="fas fa-link fa-fw"></i> &nbsp; Vincular Producto</a>
                                </li>
                                <li>
                                    <a href="producto-nuevo.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Agregar Producto</a>
                                </li>
                                <li>
                                    <a href="producto-lista.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Lista de Productos</a>
                                </li>
                               
                                <li>
                                    <a href="producto-reportes.html"><i class="fas fa-chart-pie fa-fw"></i> &nbsp; Reportes de Productos</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-user-tie fa-fw"></i> &nbsp; Responsable <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="responsable-list.html"><i class="fas fa-list fa-fw"></i> &nbsp; Listado de Responsable</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-truck fa-fw"></i> &nbsp; Transportadores <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="transportadores-list.html"><i class="fas fa-list fa-fw"></i> &nbsp; Transportadores</a>
                                </li>
                                <li>
                                    <a href="transportadores-viajes.html"><i class="fas fa-route fa-fw"></i> &nbsp; Consultar viajes</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-shopping-cart fa-fw"></i> &nbsp; Orden Compra <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="orden-compra-crear.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Crear Orden Compra</a>
                                </li>
                                <li>
                                    <a href="orden-compra-consultar.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Consultar Orden</a>
                                </li>
                                <li>
                                    <a href="orden-compra.html"><i class="fas fa-search fa-fw"></i> &nbsp; Compra</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-file-alt fa-fw"></i> &nbsp; Cotización <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="cotizacion-crear.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Crear Cotización</a>
                                </li>
                                <li>
                                    <a href="cotizacion-consultar.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Consultar Cotización</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-file-alt fa-fw"></i> &nbsp; Remisión <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="remision-crear.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Crear Remisión</a>
                                </li>
                                <li>
                                    <a href="remision-consultar.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Consultar Remisión</a>
                                </li>
                                <li>
                                    <a href="remision-sin-factura.html"><i class="fas fa-file-invoice fa-fw"></i> &nbsp; Remisión sin Factura</a>
                                </li>
                                <li>
                                    <a href="remision-alarmas.html"><i class="fas fa-bell fa-fw"></i> &nbsp; Alarmas</a>
                                </li>
                                <li>
                                    <a href="remision-reservas.html"><i class="fas fa-calendar-check fa-fw"></i> &nbsp; Reservas</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-undo fa-fw"></i> &nbsp; Devolución <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="devolucion-crear.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Crear Devolución</a>
                                </li>
                                <li>
                                    <a href="devolucion-consultar.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Consultar Devolución</a>
                                </li>
                                <li>
                                    <a href="devolucion-sin-factura.html"><i class="fas fa-file-invoice fa-fw"></i> &nbsp; Devolución sin Factura</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-file-invoice fa-fw"></i> &nbsp; Factura <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="factura-crear.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Crear Factura</a>
                                </li>
                                <li>
                                    <a href="factura-consultar.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Consultar Factura</a>
                                </li>
                                <li>
                                    <a href="factura-pendientes.html"><i class="fas fa-clock fa-fw"></i> &nbsp; Facturas Pendientes</a>
                                </li>
                                <li>
                                    <a href="factura-anuladas.html"><i class="fas fa-ban fa-fw"></i> &nbsp; Facturas Anuladas</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-file-invoice fa-fw"></i> &nbsp; Proforma <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="proforma-new.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Crear proforma</a>
                                </li>
                                <li>
                                    <a href="proforma-list.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Consultar proforma</a>
                                </li>
                                <li>
                                    <a href="proforma-summary.html"><i class="fas fa-chart-bar fa-fw"></i> &nbsp; Resumen</a>
                                </li>
                            </ul>
                        </li>
                        
                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-sync-alt fa-fw"></i> &nbsp; Reposición <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="reposition-new.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Reposición</a>
                                </li>
                                <li>
                                    <a href="reposition-list.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Consultar reposición</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-chart-bar fa-fw"></i> &nbsp; Reportes <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="reporte-ventas.html"><i class="fas fa-chart-line fa-fw"></i> &nbsp; Reporte de Ventas</a>
                                </li>
                                <li>
                                    <a href="reporte-clientes.html"><i class="fas fa-users fa-fw"></i> &nbsp; Reporte de Clientes</a>
                                </li>
                                <li>
                                    <a href="reporte-productos.html"><i class="fas fa-boxes fa-fw"></i> &nbsp; Reporte de Productos</a>
                                </li>
                                <li>
                                    <a href="reporte-finanzas.html"><i class="fas fa-dollar-sign fa-fw"></i> &nbsp; Reporte Financiero</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-sign-in-alt fa-fw"></i> &nbsp; Entrada <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="entrada-new.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Crear entrada</a>
                                </li>
                                <li>
                                    <a href="entrada-list.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Consultar entradas</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-pallet fa-fw"></i> &nbsp; Items <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="item-new.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Agregar item</a>
                                </li>
                                <li>
                                    <a href="item-list.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Lista de items</a>
                                </li>
                                <li>
                                    <a href="item-search.html"><i class="fas fa-search fa-fw"></i> &nbsp; Buscar item</a>
                                </li>
                                <li>
                                    <a href="inventario.html"><i class="fas fa-boxes fa-fw"></i> &nbsp; Inventario</a>
                                </li>
                                <li>
                                    <a href="ventas.html"><i class="fas fa-chart-line fa-fw"></i> &nbsp; Ventas</a>
                                </li>
                            </ul>
                        </li>

                      

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-sign-out-alt fa-fw"></i> &nbsp; Salida <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="salida-new.html"><i class="fas fa-plus fa-fw"></i> &nbsp; Registrar salida</a>
                                </li>
                                <li>
                                    <a href="salida-list.html"><i class="fas fa-clipboard-list fa-fw"></i> &nbsp; Consultar salidas</a>
                                </li>
                                <li>
                                    <a href="salida-pending.html"><i class="fas fa-clock fa-fw"></i> &nbsp; Salidas pendientes</a>
                                </li>
                                <li>
                                    <a href="salida-return.html"><i class="fas fa-undo-alt fa-fw"></i> &nbsp; Devoluciones</a>
                                </li>
                            </ul>
                        </li>

                        <li>
                            <a href="#" class="nav-btn-submenu"><i class="fas fa-dollar-sign fa-fw"></i> &nbsp; Ingresos <i class="fas fa-chevron-down"></i></a>
                            <ul>
                                <li>
                                    <a href="ingresos.html"><i class="fas fa-chart-line fa-fw"></i> &nbsp; Consultar Ingresos</a>
                                </li>
                            </ul>
                        </li>


                       
                    </ul>
                </nav>
            </div>
        </section>
    `;
    return sidebarHTML;
}

// Función para cargar la barra de navegación superior
function loadNavbar() {
    const navbarHTML = `
        <nav class="full-box navbar-info">
            <a href="#" class="float-left show-nav-lateral">
                <i class="fas fa-exchange-alt"></i>
            </a>
            <a href="user-update.html">
                <i class="fas fa-user-cog"></i>
            </a>
            <a href="#" class="btn-exit-system">
                <i class="fas fa-power-off"></i>
            </a>
        </nav>
    `;
    return navbarHTML;
}

// Función para inicializar los componentes
function initComponents() {
    // Cargar el menú lateral
    const sidebarContainer = document.querySelector('.main-container');
    if (sidebarContainer) {
        sidebarContainer.insertAdjacentHTML('afterbegin', loadSidebar());
    }

    // Cargar la barra de navegación
    const pageContent = document.querySelector('.page-content');
    if (pageContent) {
        pageContent.insertAdjacentHTML('afterbegin', loadNavbar());
    }

    // Inicializar el comportamiento del menú lateral
    $('.show-nav-lateral').click(function() {
        $('.nav-lateral').toggleClass('nav-lateral-show');
    });

    // Inicializar el comportamiento de los submenús
    $('.nav-btn-submenu').click(function() {
        $(this).next('ul').slideToggle();
        $(this).find('i.fa-chevron-down').toggleClass('fa-chevron-up');
    });
}

// Ejecutar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', initComponents); 