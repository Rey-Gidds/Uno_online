# Uno_online
An online uno platform built from scratch to practice my Backend and Frontend skills built with Html , Css , Js and node.js at the backend along with websockets to maintain online states of the rooms and their respective users

# Working
Working of this online platform solely depends on the frontend DOM manipulations and websockets at the node.js backend . No logins , no signups , just generate a room key share with your friends and join in.

# Overview
Users are given the option to make the room , join the room with the respective number of initial cards to start with from 1 - 8 . Allowing 4 members per room . Action cards such as draw 4 , wild , skip , reverse has been implemented . 

Stack has been used to maintain the state of the deck of cards for each room and each user
Circular Queue has been used for turn of the user while playing
Two pointers are used for reversing the turn wheel when the reverse card is played
