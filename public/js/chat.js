const socket = io();

//Elements 
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = document.querySelector('input');
const $messageFormButton = document.querySelector('button');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {"ignoreQueryPrefix":true});

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {     
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(msg)=>{
    // console.log(msg);
    const html = Mustache.render(messageTemplate,{
        'message':msg.text,
        'time': moment(msg.createdAt).format('h:mm a'),
        'username':msg.username
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
});

socket.on('locationMessage',(loc)=>{
    // console.log(loc);
    const html = Mustache.render(locationTemplate,{
        'location':loc.url,
        'time':moment(loc.createdAt).format('h:mm a'),
        'username':loc.username
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
})

// socket.on('countUpdated',(count)=>{
//     console.log('Count has been updated ',count);
// });

// document.querySelector('#increment').addEventListener('click',()=>{
//     console.log('clicked');
//     socket.emit('increment');
// });

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();

    $messageFormButton.setAttribute('disabled','disabled');

    const value = e.target.elements.message.value;

    socket.emit('message-send',value,(error)=>{
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';

        if(error){
            return console.log(error);
        }
        // console.log('Message is deliverd');
    });
});

// socket.on('message-recieved',(msg)=>{
//     console.log('message recieved is :',msg);
// });

const $locationButton = document.querySelector('#send-location');

$locationButton.addEventListener('click',(e)=>{

    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser');
    }
    
    $locationButton.setAttribute('disabled','disabled');

    navigator.geolocation.getCurrentPosition((position)=>{
        const data = {
            latitude : position.coords.latitude,
            longitude: position.coords.longitude
        };
        socket.emit('sendLocation',data,(msg)=>{
            // console.log(msg);
            $locationButton.removeAttribute('disabled');
        });
    })
});

socket.emit('join',{username,room}, (error)=>{
    if(error){
        location.href='/';
        alert('username already exist! try different username')
    }
});

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML=html;
})