---
title: 'Subverting the Linux Kernel for Fun and Profit'
date: '2017-04-22'
slug: '/rootkit-poc/'
draft: false
description: 'Demonstration of a simple rootkit developed for the 2.6.X Linux kernel.'
tags:
  - Linux
  - OS Development
---

I've built a simple rootkit for the 2.6.x Linux kernel that has the ability to hide itself as well as hide processes. It's fairly simple feature-wise but gave me a more insight into how rootkits work and allowed me to get my hands dirty in Linux kernel module development.

I'm not going to go into the specifics of how the code works, rather I'm just going to give a quick demo of the rootkit in action.

### What Is a Rootkit?

First let's explain what a rootkit is and how it relates to security. According to [Veracode](https://www.veracode.com/security/rootkit):

> A rootkit is a clandestine computer program designed to provide continued privileged access to a computer while actively hiding its presence. The term rootkit is a connection of the two words "root" and "kit." Originally, a rootkit was a collection of tools that enabled administrator-level access to a computer or network. Root refers to the Admin account on Unix and Linux systems, and kit refers to the software components that implement the tool. Today rootkits are generally associated with malware – such as Trojans, worms, viruses – that conceal their existence and actions from users and other system processes.

So originally rootkits were used to provide remote administrator-level access to systems for legitimate uses. Schools and businesses were typical users of these rootkits. However, over time rootkits found their home in malware. A rootkit installed on a victim's machine can conceal itself and allow remote access to the machine via a backdoor.

### Avoiding Detection

To avoid detection, a rootkit must able to hide itself from the typical places you would be able to list installed kernel modules. This includes `/proc/modules` and `/sys/module`. As you can see in the figure below, the rootkit is not able to be found through `lsmod` after giving it the `modhide` command. All commands are issued to the rootkit through a character device.

<figure>
    <br/>
	<img style="" src="./modhide.gif" alt="modhide cmd">
	<figcaption>modehide command</figcaption>
</figure>

To be able to uninstall the rootkit we must first reveal it by sending it the `modshow` command. Now we can safely use `rmmod` to remove it.

### Hiding Processes

The rootkit also has the ability to hide currently running processes. This can be achieved by issuing the `phide` command with a PID as an argument. Let's see this in action.

<figure>
    <br/>
	<img style="" src="./phide.gif" alt="phide cmd">
	<figcaption>phide command</figcaption>
</figure>

Just like with `modhide`, we have a corresponding `pshow` command to reveal the process.

### Final Thoughts

There are many features that a typical rootkit would include that are not included in this implementation. This is by no means complete and is just a simple example implementation.

Source code available on [GitHub](https://github.com/triedal/rootkit).
