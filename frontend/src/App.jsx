import React, { useState, useEffect } from 'react';
import axios from "axios";	//for 

import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import TodoList from './components/TodoList.jsx';
import './App.css';

const API_HOST = import.meta.env.VITE_API_HOST || 'localhost';
const API_PORT = import.meta.env.VITE_API_PORT || '3001';
const API_URL = `http://${API_HOST}:${API_PORT}`;

function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Loading state for initial check
    const [view, setView] = useState('login'); // 'login' or 'register'
		const [uploadProgressText, setUploadProgressText] = useState(true);

    // 1. SESSION CHECK (The Auth Bridge)
    // Run this once when the app loads to see if we are already logged in
    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/me`, {
                    credentials: 'include' // CRITICAL: Sends the cookie
                });
                
                if (response.ok) {
                    const user = await response.json();
                    setCurrentUser(user);
                }
            } catch (err) {
                console.log("Not logged in or server down");
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const handleLogin = (user) => {
        setCurrentUser(user);
    };

    const handleLogout = async () => {
        try {
            // Tell server to destroy session
            await fetch(`${API_URL}/api/auth/logout`, { credentials: 'include' });
            setCurrentUser(null);
            setView('login');
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    const handleRegisterSuccess = () => {
        alert("Account created successfully! Please log in.");
        setView('login');
    };

    const getGreetingName = () => {
        if (!currentUser) return '';
        return currentUser.full_name || currentUser.username;
    };

    // Show a loading spinner while checking session
    if (isLoading) return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading...</div>;

		const profilePicStyle = {
			width: "50px", 
			height: "50px", 
			borderRadius: "30px", 
			verticalAlign: "middle"
		};

		/*
			No documented exceptions
			Parts of the function still runs after the callback is called,
			namely the code for updating picture uploading progress which calls setUploadProgressText.
		*/
		function uploadProfilePicture(htmlEventFromInput){
			const htmlInput = htmlEventFromInput.target;
			const selectedPictureFiles = htmlInput.files;
			const noSelectedFile = selectedPictureFiles.length === 0;
			if(noSelectedFile) return;
			const selectedFile = selectedPictureFiles[0];
			const MAX_PICTURE_SIZE_BYTES = 1024*1024;
			if(selectedFile.size >= MAX_PICTURE_SIZE_BYTES){
				setUploadProgressText("File must be within 1MiB.");
				return;
			}
				
			const formData = new FormData();
			const PROFILE_PICTURE_KEY_IN_FORMDATA = 'image';
			formData.append(PROFILE_PICTURE_KEY_IN_FORMDATA, selectedFile);
			
			//Basically onUploadProgress may not be called yet, especially when there's network error
			//so we need to set text separate from the one in onUploadProgress
			setUploadProgressText("Uploading...");
			
			//Using axios for uploading picture so progress could be displayed
			//Using promise instead of await because server response may take time,
			//and we want to notify the user that the server acknowledges the upload,
			//which is is not the same as fully uploading the file to the server
			const responsePromise = axios.put(
				API_URL + '/api/pfp/' + currentUser.id, formData, {
					headers: {"Content-Type": "multipart/form-data"},
					onUploadProgress: (progressEvent) => {
						const uploadPercentage = (progressEvent.loaded / progressEvent.total) * 100.0;
						setUploadProgressText('Uploading: ' + uploadPercentage + '%');
					}
				}
			);
			function responseFulfilled(response){
				console.log(response);
				//Response from axios doesn't have Response.ok bool
				const responseIsOk = (response.status >= 200) && (response.status <= 299);
				if(responseIsOk) setUploadProgressText("Uploaded image.");
				else setUploadProgressText("Server status: " + response.status);
			}
			function responseRejected(reason){
				console.log(reason);
				setUploadProgressText(reason.message);
			}
			responsePromise.then(responseFulfilled, responseRejected);
		}
		

	return (
		<div>
				<div className='app-container'>
						<div className='top-bar'>
								<img className='logo' src="/cei.png" alt="cei logo" style={{ maxHeight: "5rem", maxWidth: "5rem" }} />
								<h1 className='title'>Full Stack Todo App</h1>
								
								{/* NEW: Hello Message in Main Container */}
								{currentUser && (
										<span className="profile-container">
											<span style={{ marginRight: '20px', fontWeight: 'bold'}}>{getGreetingName()}</span>
											<img src={API_URL + '/api/pfp/' + currentUser.id} alt="" style={profilePicStyle}/>
											<p/>
											<input name="profilePictureInput" type="file" accept=".png,.jpg,.jpeg,.webp,.gif" onChange={uploadProfilePicture}/>		
											<p style={{fontSize: "12px"}}>{uploadProgressText}</p>													
										</span>
								)}
						</div>

						{currentUser ? (
								/* The snippet you requested */
								<TodoList 
										username={currentUser.username} 
										email={currentUser.email} 
										userId={currentUser.id}
										full_name={currentUser.full_name}
										onLogout={handleLogout} 
								/>
						) : (
								/* ... Login/Register view ... */
								<div className="auth-container">
										{/* ... (Same as before) ... */}
										{view === 'login' ? (
												<>
														<Login onLogin={handleLogin} />
														<p style={{ textAlign: 'center', marginTop: '1rem' }}>
																Don't have an account?{' '}
																<button onClick={() => setView('register')} style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }}>
																		Register
																</button>
														</p>
												</>
										) : (
												<Register onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setView('login')} />
										)}
								</div>
						)}
				</div>
		</div>
			);
}

export default App;