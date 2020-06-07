---
title: 'Roll Your Own: Bootloader Edition'
date: '2017-01-10'
slug: '/ryo-bootloader/'
draft: false
description: 'How to build a simple bootloader with assembly.'
tags:
  - Linux
  - OS Development
---

There's something innately cool about low-level OS development. In order to learn more about this I have built an _extremely_ simple bootloader using assembly language.

### What Is a Bootloader?

When you turn on your computer, the **BIOS** (Basic Input Output System) runs a **POST** (Power On Self Test) test to ensure your machine has ample power, memory, and devices installed. If this test passes, the BIOS then loads a bootloader which is responsible for loading the kernel.

When the bootloader program is ran it is executed under 16-bit Real Mode. Real Mode means that you have unlimited direct access to all addressable memory. Also, virtual memory and memory protection do not exist at this point.

In this example we will not be loading a kernel, but instead display a simple "Hello, World!" on an x86 emulator. However, the concepts learned here are the basis for building a real bootloader.

### The Nitty-Gritty

Here is the full program. I will walk you through it step-by-step below.

```
;-------------
; tinyboot.asm
;-------------

        bits    16                      ; Declare we are in 16 bit real mode

        org     0x7c00                  ; BIOS loads bootloader at this address

start:
        jmp         main



msg     db          "Hello, World!", 0


print:
        lodsb                            ; Transfers byte @ DS:SI into AL && SI++
        or          al, al
        jz          return
        mov         ah, 0x0e             ; Load "Teletype Output"
        int         0x10                 ; Print character to screen
        jmp         print

return:
        ret

main:
        cli                              ; Disable hardware interrupts
        mov         si, msg
        call        print
        hlt

times 510 - ($-$$) db 0                  ; Fill remaining bytes to 0
dw 0xAA55                                ; Boot Signature
```

Thankfully there's not too much code here. Let's break it down.

```
bits    16
org     0x7c00
```

The first line declares we are using 16 bit mode. All x86 compatible computers boot into 16 bit mode. The second line tells the compiler to ensure all address are relative to `0x7c00`. The BIOS automatically loads us into `0x7c00` so we need to account for that.

```
start:
        jmp         main
```

Assembly programs are read line-by-line. We make the first executable command to jump over the rest of our helper operations and into the main part of our program.

```
main:
        cli                              ; Disable hardware interrupts
        mov         si, msg
        call        print
        hlt
```

In main, we first disable all hardware interrupts. This is necessary for bootloaders that run on x86 machines. Next, we move the address of the first character in `msg` into the `si` register. This sets us up to be able to run our print function to print `msg`. After the address has been loaded into `si` we call the print function. Let's see what `print` looks like.

```
print:
        lodsb                            ; Transfers byte @ DS:SI into AL && SI++
        or          al, al
        jz          return
        mov         ah, 0x0e             ; Load "Teletype Output"
        int         0x10                 ; Print character to screen
        jmp         print
```

`lodsb` loads what is pointed to by `si` into the `al` register and increments `si` by one. We then check if we've reached the end of the null terminated string with `or al, al`. If we have we return out of the function, if not we keep going. Now we set up to print the first character to the screen. We are going to use the `0x10` interrupt to print but first we must load `0x0e` into `ah`. `0x0e` is the number of the _Teletype Output_ operation in the `0x10` interrupt vector. Finally, we call the interrupt and then loop to the top of `print` again and repeat until we've reached the end of the string.

```
main:
        cli                              ; Disable hardware interrupts
        mov         si, msg
        call        print
-->     hlt
```

After returning out the print operation we halt the program because we are finished.

```
times 510 - ($-$$) db 0
dw 0xAA55
```

In order for a bootloader to be valid it needs to be **exactly** 512 bytes. The first line ensures that we fill whatever space we didn't use up to 512 with 0's. `dw 0xAA55` is the _Boot Signature_. The BIOS looks for this value when determining for a bootable disk. This declares the disk the bootloader is stored on as bootable.

### Running the Bootloader

We will be using an x86 emulator called [QEMU](http://wiki.qemu.org/) to test our bootloader.

First, we must compile the assembly program into a binary. We will be using NASM for this.

```sh
nasm -f bin tinyboot.asm -o tinyboot.bin
```

Once we have the binary we will be using `dd` to convert the binary into a floppy image we can boot from.

```sh
dd conv=notrunc if=tinyboot.bin of=floppy.flp
```

Almost there! We just need to launch QEMU with our new floppy image to see the magic happen.

```sh
qemu-system-i386 -fda floppy.flp
```

<figure>
    <br/>
	<img style="" src="./qemu.png" alt="Bootloader">
	<figcaption>Sample bootloader running on QEMU</figcaption>
</figure>

So there you have it...our beautiful bootloader in all its glory!

### Final Thoughts

This was a fun exercise but writing a custom bootloader is not very practical. If you were to develop an OS it is best to use a pre-existing bootloader like [GRUB](https://www.gnu.org/software/grub/). Also, if you would like to learn more about bootloaders and OS development in general [BrokenThorn](http://www.brokenthorn.com/) and [OS Dev](http://wiki.osdev.org/Main_Page) are excellent resources.

Source code available on [GitHub](https://github.com/triedal/misc/blob/master/bootloader-example/tinyboot.asm).
