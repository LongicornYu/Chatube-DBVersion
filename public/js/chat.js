// This file is executed in the browser, when people visit /chat/<random id>

$(function(){

	var socket = io();

	socket.on('connect', function(){
		console.log(userObj);
		socket.emit('friendStatusChange', {userId: userObj._id});
	});

	socket.on('refreshFriendList', function(data){
		var renderedHTML='';
		console.log('data'+data.length);
		for (var i = 0; i < data.length; i++) {
			renderedHTML+='<li>'
				+'<button  id="friendlink">'
					+'<a href="/loadchat/'+ data[i].username.toString()+ '">'
							+'<i class="fa fa-circle '+data[i].online.toString()+'onlinestatus"></i>'
							+'<img src='+data[i].avatar.toString() +' class="friendlistavatar"/>'
							+'<span class="nav-text '+data[i].online.toString() +'online">'
								+ data[i].username.toString()
							+'</span>'
					+'</a>'
				+'</button>'
			+'</li>';
		}
		var htmlobj = $(renderedHTML);

		//console.log('renderedhtml'+renderHTML);
		$("#friendlist").html(htmlobj);
	});


	if(chatObj!=null)
	{
		// variables which hold the data for each person
		var name = "",
			email = "",
			vartar = "",
			img = "",
			friend = "";

		var id = chatObj._id;

		// cache some jQuery objects
		var section = $(".section"),
			footer = $("footer"),
			onConnect = $(".connected"),
			inviteSomebody = $(".invite-textfield"),
			personInside = $(".personinside"),
			chatScreen = $(".chatscreen"),
			videoChatScreen = $("#videoChatArea"),
			videoChatInviteReject = $(".videoChatInviteReject"),
			videoChatInviteWait = $(".videoChatInviteWait"),
			audioChatScreen = $("#audioChatArea"),
			audioChatInviteReject = $(".audioChatInviteReject"),
			audioChatInviteWait = $(".audioChatInviteWait"),
			left = $(".left"),
			noMessages = $(".nomessages"),
			videoChatInviteCancelled = $(".videoChatInviteCancelled")
			videoChatInviteOnwerCancelled = $(".videoChatInviteOnwerCancelled")
			videoChatInvite = $(".videoChatInvite");
			audioChatInviteCancelled = $(".audioChatInviteCancelled")
			audioChatInviteOnwerCancelled = $(".audioChatInviteOnwerCancelled")
			audioChatInvite = $(".audioChatInvite");
			tooManyPeople = $(".toomanypeople");

		// some more jquery objects
		var chatNickname = $(".nickname-chat"),
			leftNickname = $(".nickname-left"),
			loginForm = $(".loginForm"),
			yourName = $("#yourName"),
			yourEmail = $("#yourEmail"),
			yourAvatar = $(".avatarSelectorImg.selected"),
			hisName = $("#hisName"),
			hisEmail = $("#hisEmail"),
			hisAvatar = $(".youravatarSelectorImg.selected"),
			chatForm = $("#chatform"),
			textarea = $(".emoji-wysiwyg-editor"),
			messageTimeSent = $(".timesent"),
			chats = $(".chats");

		// these variables hold images
		var ownerImage = $("#ownerImage"),
			leftImage = $("#leftImage"),
			topImage = $("#topImage"),
			noMessagesImage = $("#noMessagesImage");


		socket.emit('load', id);


		// save the gravatar url
		socket.on('img', function(data){
			img = data;
		});

		socket.on('videoChatInvite', function(data){

			if (socket.io.engine.id != data.senderId)
			{
				showMessage("VideoChatReqest", data);
				var volume = document.getElementById("volume-input");

				var sound = document.getElementById("videoCallaudio", data);
				sound.loop=true;
				sound.volume = (volume.value)/100.0;
		    	sound.play();
			}
			else
			{
				showMessage("VideoChatReqestWaiting", data);
			}
		});

		socket.on('audioChatInvite', function(data){

			if (socket.io.engine.id != data.senderId)
			{
				showMessage("AudioChatReqest", data);
				var volume = document.getElementById("volume-input");

				var sound = document.getElementById("videoCallaudio", data);
				sound.loop=true;
				sound.volume = (volume.value)/100.0;
				sound.play();
			}
			else
			{
				showMessage("AudioChatReqestWaiting", data);
			}
		});


		socket.on('videoChatRefused', function(senderId){

			if (socket.io.engine.id === senderId)
			{
				showMessage("VideoChatRejected");
			}
			else
			{
				showMessage("VideoChatRejectedOwner");
			}

		});

		socket.on('videoChatSelfCancel', function(senderId){

			if (socket.io.engine.id === senderId)
			{
				showMessage("VideoChatSelfCancelled");
			}
			else
			{
				var sound = document.getElementById("videoCallaudio");
				//sound.volume = (volume.value)/100.0;
				sound.pause();
				showMessage("VideoChatOwnerCancelled");
			}

		});

		socket.on('audioChatRefused', function(senderId){

			if (socket.io.engine.id === senderId)
			{
				showMessage("AudioChatRejected");
			}
			else
			{
				showMessage("AudioChatRejectedOwner");
			}

		});

		socket.on('audioChatSelfCancel', function(senderId){

			if (socket.io.engine.id === senderId)
			{
				showMessage("AudioChatSelfCancelled");
			}
			else
			{
				var sound = document.getElementById("videoCallaudio");
				//sound.volume = (volume.value)/100.0;
				sound.pause();
				showMessage("AudioChatOwnerCancelled");
			}

		});


		socket.on('renderSnap', function(data){
			if (socket.io.engine.id === data.senderId)
			{
				renderPhotobuffertoArea(data.buf, true, data.user, data.img);
			}
			else
			{
				renderPhotobuffertoArea(data.buf,false,data.user, data.img);
			}

		});

		// receive the names and avatars of all people in the chat room
		socket.on('peopleinchat', function(data){

				showMessage("connected");
				showMessage("personinchat");

				socket.emit('login', {user: userObj.username, avatar: userObj.avatar, id: id, email: userObj.email, userId: userObj._id});

		});

		// Other useful

		socket.on('startChat', function(data){

			if(data.boolean && data.id == id) {

				chats.empty();
				if(messagesObj != null)
				{
					for (var i in messagesObj) {
						createChatMessage(messagesObj[i].isImage,messagesObj[i].message,messagesObj[i].fromUsername,messagesObj[i].fromUserImg,moment(new Date(messagesObj[i].sentDatetime)));
					}
				}

				showMessage("chatStarted");

			}
		});

		socket.on('leave',function(data){

			if(data.boolean && id==data.room){

				showMessage("somebodyLeft", data);
			}

		});


		socket.on('tooMany', function(data){

			if(data.boolean && name.length === 0) {

				showMessage('tooManyPeople');
			}
		});

		socket.on('receive', function(data){
			showMessage('chatStarted');
			var volume = document.getElementById("volume-input");

			var sound = document.getElementById("audio");
			sound.volume = (volume.value)/100.0;
	    	sound.play();

	    	if (!data.isImage)
	    	{
				if(data.msg.trim().length) {
					createChatMessage(data.isImage,data.msg, data.user, data.img, moment());
					scrollToBottom();
				}
			}
			else
			{
				if(data.msg.trim().length) {
					createChatMessage(data.isImage, data.msg, data.user, data.img, moment());
					scrollToBottom();
				}
			}
		});

		textarea.keypress(function(e){

			// Submit the form on enter
			var keyCode = (e.which ? e.which : e.keyCode);

	        if (keyCode === 10 || keyCode == 13 && e.ctrlKey) {
				e.preventDefault();
				chatForm.trigger('submit');
			}

		});

		chatForm.on('submit', function(e){
			e.preventDefault();
			if (textarea.html().length > 0)
			{
				//showMessage("chatStarted");
				if(textarea.html().trim().length) {

					if (textarea.html().includes("<img"))
					{
						createChatMessage(true,textarea.html().toString(), userObj.username, userObj.avatar, moment());
						scrollToBottom();

						socket.emit('msg', { isImage: true, msg: textarea.html().toString(), user: userObj.username, img: userObj.avatar, sendtoUserId:friendObj._id, sendfromUserId:userObj._id,chatId:chatObj._id});
					}
					else
					{
						createChatMessage(false,textarea.html(), userObj.username, userObj.avatar, moment());
						scrollToBottom();

						// Send the message to the other person in the chat
						socket.emit('msg', {isImage: false, msg: textarea.html(), user: userObj.username, img: userObj.avatar, sendtoUserId:friendObj._id, sendfromUserId:userObj._id,chatId:chatObj._id});
					}
				}
				// Empty the textarea
				textarea.text("");
			}
		});


		$('[contenteditable]').on('keydown', function(e){
		    if(e.keyCode == 9){
		        e.preventDefault();
		        document.execCommand('insertHTML', false, '&#9;');
		    }
		}).css('white-space', 'pre');


		// Update the relative time stamps on the chat messages every minute

		setInterval(function(){

			messageTimeSent.each(function(){
				var each = moment($(this).data('time'));
				$(this).text(each.fromNow());
			});

		},60000);


		function renderPhotobuffertoArea(data,ismine, user,imgg) {
		    var now = moment();
				var who = '';

				if(ismine!=true) {
					who = 'me';
				}
				else {
					who = 'you';
				}

				var li = $(
						'<li class=' + who + '>'+
							'<div class="image">' +
								'<img src=' + imgg + ' />' +
								'<b></b>' +
								'<i class="timesent" data-time=' + now + '></i> ' +
							'</div>' +
							'<div id="postedMessage"><p></p></div>' +
							'<div id="divpostedMessage"></div>' +
						'</li>');

		    var canvas = document.createElement('canvas');
		    canvas.width = 1000;
		    canvas.height = 1000;

				var canvasWidth  = canvas.width;
				var canvasHeight = canvas.height;
				var ctx = canvas.getContext('2d');
				var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

				imageData.data.set(data);
				ctx.putImageData(imageData, 0, 0);

				// trail is the element holding the incoming images
		    li.find('p').after(canvas);
		    li.find('p').hide();

				if(who==='me')
				{
					li.find('b').text('Me');
				}
				else {
					li.find('b').text(user);
				}
				$(".chats").append(li);

				var messageTimeSent = $(".timesent");
				messageTimeSent.last().text(now.fromNow());

		}

		// Function that creates a new chat message
		function createChatMessage(isImage,msg,user,imgg,now){

			var who = '';

			if(user===userObj.username) {
				who = 'me';
			}
			else {
				who = 'you';
			}

			var li = $(
					'<li class=' + who + '>'+
						'<div class="image">' +
							'<img src=' + imgg + ' />' +
							'<b></b>' +
							'<i class="timesent" data-time=' + now + '></i> ' +
						'</div>' +
						'<div id="postedMessage"><p></p></div>' +
						'<div id="divpostedMessage"></div>' +
					'</li>');


			if (isImage)
			{
				// use the 'text' method to escape malicious user input
				li.find('p').after(msg);
				li.find('p').hide();

			}
			else
			{
				var emoji = new EmojiConvertor();
				emoji.img_set = 'apple';
				emoji.replace_mode = emoji.replace_mode;;
				emoji.text_mode = false;
				var out = emoji.replace_colons(msg);

				// use the 'text' method to escape malicious user input
				li.find('p').html(out);
			}

			if(who==='me')
			{
				li.find('b').text('Me');
			}
			else {
				li.find('b').text(user);
			}
			chats.append(li);

			messageTimeSent = $(".timesent");
			messageTimeSent.last().text(now.fromNow());

			if(msg ==='1020')
			{
				startfirework();
			}
		}

		function scrollToBottom(){
			$("html, body").animate({ scrollTop: $(document).height()-$(window).height() },1000);
		}

		function isValid(thatemail) {

			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(thatemail);
		}

		function showMessage(status,data){

			if(status === "connected"){

				section.children().css('display', 'none');
				onConnect.fadeIn(1200);
			}

			else if(status === "inviteSomebody"){

				// Set the invite link content
				$("#link").text(window.location.href);

				onConnect.fadeOut(1200, function(){
					inviteSomebody.fadeIn(1200);
				});
			}

			else if(status === "personinchat"){

				videoChatScreen.css("display", "none");
				onConnect.css("display", "none");
				//personInside.fadeIn(1200);

				chatNickname.text(friendObj.username);
				ownerImage.attr("src",friendObj.avatar);
			}
			else if(status === "chatStarted"){
				if (videoChatScreen.css('display') != "none")
				{
					section.children().css('display','none');
					videoChatScreen.css('display','block');
				}else {
					section.children().css('display','none');
					videoChatScreen.css('display','none');
				}
				footer.css('display', 'block');
				$('.main-menu').css('bottom', '150px');
				chatScreen.css('display','block');
			}

			else if(status === "somebodyLeft"){

				leftImage.attr("src",data.avatar);
				leftNickname.text(data.user);

				//section.children().css('display','none');
				//footer.css('display', 'none');
				left.fadeIn(1200);
			}

			else if(status === "tooManyPeople") {

				section.children().css('display', 'none');
				tooManyPeople.fadeIn(1200);
			}

			else if (status === "VideoChatReqest") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				topImage.attr("src",data.avatar);
				videoChatInvite.fadeIn(1200);
			}
			else if (status === "VideoChatReqestWaiting") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				videoChatInviteWait.fadeIn(1200);
			}
			else if (status === "VideoChatRejectedOwner") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				videoChatInviteReject.fadeIn(1200);
			}
			else if (status === "VideoChatRejected") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				videoChatInvite.fadeOut(1200);
			}
			else if (status === "VideoChatSelfCancelled") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				videoChatInvite.fadeOut(1200);
				videoChatInviteOnwerCancelled.fadeIn(1200);
			}
			else if (status === "VideoChatOwnerCancelled") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				videoChatInviteWait.fadeOut(1200);
				videoChatInviteCancelled.fadeIn(1200);
			}
			else if (status === "AudioChatReqest") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				topImage.attr("src",data.avatar);
				audioChatInvite.fadeIn(1200);
			}
			else if (status === "AudioChatReqestWaiting") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				audioChatInviteWait.fadeIn(1200);

			}
			else if (status === "AudioChatRejectedOwner") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				audioChatInviteReject.fadeIn(1200);
			}
			else if (status === "AudioChatRejected") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				audioChatInvite.fadeOut(1200);
			}
			else if (status === "AudioChatSelfCancelled") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				audioChatInvite.fadeOut(1200);
				audioChatInviteOnwerCancelled.fadeIn(1200);
			}
			else if (status === "AudioChatOwnerCancelled") {
				section.children().css('display', 'none');
				chatScreen.css('display','block');
				audioChatInviteWait.fadeOut(1200);
				audioChatInviteCancelled.fadeIn(1200);
			}
		}
	}
});
