function loguear() {
    let user=document.getElementById("UserName").value;
    let pass=document.getElementById("UserPassword").value;

    if(user=="" || pass==""){
        alert("Por favor, complete todos los campos.");
        return false;
    }

    if(user=="admin" && pass=="admin"){
        alert("Bienvenido, admin.");
        window.location.href="home.html";

    }else {
        alert("Usuario o contraseña incorrectos.");
        return false;
    }

}

// Asocia el evento al botón de inicio de sesión
document.getElementById('btnLogin').addEventListener('click', function(event) {
    event.preventDefault(); // Evita el comportamiento predeterminado del enlace
    loguear();
});