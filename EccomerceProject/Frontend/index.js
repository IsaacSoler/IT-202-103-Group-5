const bar = document.getElementById('bar');
const closeIcon = document.getElementById('closeIcon');
const nav=document.getElementById('navbar');
if (bar){
    bar.addEventListener('click',()=>{
        nav.classList.add('active')
    })
}
if (closeIcon){
    closeIcon.addEventListener('click',()=>{
        nav.classList.remove('active')
    })
}