const socket=io() //to connect to the server

//elements
const $messageForm=document.querySelector('#message-form')
const $messageFormInput=$messageForm.querySelector('input')
const $messageFormButton=$messageForm.querySelector('Button')
const $sendLocationButton=document.querySelector('#send-location')
const $messages=document.querySelector('#messages')

//templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

//options
const {username, room}=Qs.parse(location.search, {ignoreQueryPrefix: true})


const autoscroll=()=>{
  const $newMessage=$messages.lastElementChild
  const newMessageMargin=parseInt(newMessageStyles.marginBottom)
  const newMessageStyles=getComputedStyle($newMessage)
  const newMessageHeight=$newMessage.offsetHeight + newMessageMargin

  //height of the container
  const visibleHeight=$messages.offsetHeight

  //how far have I scrolled
  const containerHeight=$messages.scrollHeight

  const scrollOffset=$messages.scrollTop + visibleHeight
  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
 }
}

socket.on('message',(data)=>{
    console.log(data)  //client recieving the data send by the server at the console i.e "welcome"
    const html=Mustache.render(messageTemplate, {
        username: data.username,
        message:data.text,
        createdAt:moment(data.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (url)=>{
    console.log(url)
    const html=Mustache.render(locationTemplate,{
        username:message.username,
        url: url.url,
        createdAt:moment(url.createdAt).format('h:mm a')

    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room, users})=>{
    console.log(room)
    console.log(users)
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault() //prevent a full refresh


    $messageFormButton.setAttribute('disabled','disabled')

    const message=e.target.elements.message.value //get the data in the form
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value=" "
    $messageFormInput.focus() //cursor back to the start


    socket.emit('sendmessage',message)  // and send the messsage to the server 
    socket.broadcast.emit('message','a new user has joined')


})


$sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
         console.log(position)
         socket.emit('sendlocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
         },()=>{
            $sendLocationButton.removeAttribute('disabled')
                console.log('Location shared!')
         })
    })
})


socket.emit('join',{ username, room},(error)=>{
    if(error){
        alert(error)
        location.href='/' //go back to the initial page
    }
})