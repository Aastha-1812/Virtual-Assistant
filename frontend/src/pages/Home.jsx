import React, { useContext, useEffect, useRef, useState } from "react";
import { userDataContext } from "../context/UserContext.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import aiImg from "../assets/ai.gif";
import userImg from "../assets/user.gif";
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";

const Home = () => {
  const { userData, serverUrl, setUserData, getGeminiResponse } =
    useContext(userDataContext);
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const isSpeakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const synth = window.speechSynthesis;
  const isRecognizingRef = useRef(false);
  const [ham, setHam] = useState(false);

  const handleLogOut = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true,
      });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.log(error);
    }
  };

  const startRecognition = () => {
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognitionRef.current?.start();
        setListening(true);
      } catch (error) {
        if (!error.message.includes("start")) {
          console.error("Recognition error : ", error);
        }
      }
    }
  };

  const speak = (text) => {
    const utterence = new SpeechSynthesisUtterance(text); //speak the text given
    utterence.lang = "hi-IN";
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find((v) => v.lang === "hi-IN");
    if (hindiVoice) {
      utterence.voice = hindiVoice;
    }
    isSpeakingRef.current = true;
    utterence.onend = () => {
      setAiText("");
      isSpeakingRef.current = false; //as soon as speaking is stopped start the microphone
      setTimeout(() => {
        startRecognition();
      }, 800);
    };
    synth.cancel(); //pehle se koi speech ho toh cancel karo
    synth.speak(utterence); //speak through window
  };

  const handleCommand = (data) => {
    const { type, userInput, response } = data;
    speak(response); //will say the gemini response and would move in switch only if the type matches the following types:
    if (type === "google-search") {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    }
    if (type === "calculator-open") {
      window.open(`https://www.google.com/search?q=calculator`, "_blank");
    }
    if (type === "instagram-open") {
      window.open(`https://www.instagram.com/`, "_blank");
    }
    if (type === "facebook-open") {
      window.open(`https://www.facebook.com/`, "_blank");
    }
    if (type === "weather-show") {
      window.open(`https://www.google.com/search?q=weather`, "_blank");
    }
    if (type === "youtube-search" || type === "youtube-play") {
      const query = encodeURIComponent(userInput);
      window.open(
        `https://www.youtube.com/results?search_query=${query}`,
        "_blank"
      );
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimRsults = false;

    recognitionRef.current = recognition;

    let isMounted = true; //flag to avoid setstate on unmounted component

    //start recognition after 1second delay only if component is still mounted

    const startTimeout = setTimeout(() => {
      if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
        try {
          recognition.start();
          console.log("recognition requested to start");
        } catch (error) {
          if (error.name !== "InvalidStateError") {
            console.error(error);
          }
        }
      }
    }, 1000);

    recognition.onstart = () => {
      //console.log("Recognition started");
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);
      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start();
              console.log("Recognition restarted");
            } catch (e) {
              if (e.name !== "InvalidStateError") {
                console.error(e);
              }
            }
          }
        }, 1000);
      }
    };

    recognition.onerror = (event) => {
      console.warn("recognition error : ", event.error);
      isRecognizingRef.current = false;
      setListening(false);
      if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start();
              console.log("Recognition restarted after error");
            } catch (e) {
              if (e.name !== "InvalidStateError") {
                console.error(e);
              }
            }
          }
        }, 1000);
      }
    };
    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim(); //this is where our i/p would be present
      if (
        transcript.toLowerCase().includes(userData.assistantName.toLowerCase())
      ) {
        setAiText("");
        setUserText(transcript);
        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);
        const data = await getGeminiResponse(transcript);
        console.log(data);
        handleCommand(data);
        setAiText(data.response);
        setUserText("");
      }
    };

    const greeting = new SpeechSynthesisUtterance(
      `Hello ${userData.name}, what can I help you with ?`
    );
    greeting.lang = "hi-IN";

    window.speechSynthesis.speak(greeting);

    return () => {
      isMounted = false;
      clearTimeout(startTimeout);
      recognition.stop();
      setListening(false);
      isRecognizingRef.current = false;
    };
    // const fallback = setInterval(() => {
    //   if (!isSpeakingRef.current && !isRecognizingRef.current) {
    //     safeRecognition();
    //   }
    //   safeRecognition();
    //   return () => {
    //     recognition.stop();
    //     setListening(false);
    //     isRecognizingRef.current = false;
    //     clearInterval(fallback);
    //   };
    // }, 2000); //default -> 10000
  }, []);

  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-[black] to-[#030353] flex justify-center items-center flex-col p-[20px] gap-[20px]">
      <CgMenuRight
        className="lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]"
        onClick={() => setHam(true)}
      />
      <div
        className={`absolute  lg:hidden top-0 w-full h-full bg-[#00000050] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${
          ham ? "translate-x-0" : "translate-x-full"
        } transition-transform`}
      >
        <RxCross1
          className="text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]"
          onClick={() => setHam(false)}
        />
        <button
          className="min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px]  cursor-pointer  px-[20px] py-[10px] "
          onClick={() => navigate("/customize")}
        >
          Customize Your Assistant
        </button>
        <button
          className="min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px]  cursor-pointer "
          onClick={handleLogOut}
        >
          Log Out
        </button>
        <div className="w-full h-[2px] bg-gray-400">
          <h1 className="text-white font-semibold text-[19px]">History</h1>
        </div>
        <div className="w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col ">
          {userData.history?.map((his) => (
            <span className="text-gray-200 text-[18px] truncate">{his}</span>
          ))}
        </div>
      </div>
      <button
        className="min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px] mt-[30px] cursor-pointer absolute top-[20px] right-[20px] px-[20px] py-[10px] hidden lg:block"
        onClick={() => navigate("/customize")}
      >
        Customize Your Assistant
      </button>
      <button
        className="min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full text-[19px] mt-[30px] cursor-pointer absolute top-[100px] right-[20px] hidden lg:block"
        onClick={handleLogOut}
      >
        Log Out
      </button>
      <div className="w-[300px] h-[400px] flex justify-center items-center flex-col shadow-lg">
        <img
          src={userData?.assistantImage}
          alt=""
          className="h-full object-cover"
        />
      </div>
      <h1 className="text-white text-[18px] font-semibold">
        I'm {userData?.assistantName}
      </h1>
      {!aiText && <img src={userImg} className="w-[200px]" />}
      {aiText && <img src={aiImg} className="w-[200px]" />}
      <h1 className="text-white text-[18px] font-semibold text-wrap">
        {userText ? userText : aiText ? aiText : null}
      </h1>
    </div>
  );
};

export default Home;
