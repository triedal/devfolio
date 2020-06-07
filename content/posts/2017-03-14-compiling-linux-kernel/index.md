---
title: 'Compiling The Vanilla Linux Kernel'
date: '2017-03-14'
slug: '/compile-linux-kernel/'
draft: false
description: 'Guide to building the Linux kernel.'
tags:
  - Linux
  - OS Development
---

Today I'm going to walk you through how to build the vanilla Linux kernel step-by-step. Typically you will never need to compile your own kernel but it's interesting to know how it's done regardless. As a quick note, the Linux kernel we are going to be building today is different than the kernel you get from your distribution (Ubuntu, Debian, etc). This is the raw kernel that comes from Linux Torvalds himself. Linux kernels shipped from distributions are modified versions of the mainline kernel that include patches and customizations from the distributor.

I will be building the latest stable kernel (4.10.2 at the time of this writing) on Ubuntu 14.04 so these steps may not be exactly correct for you. However, the general process is the same.

### Prerequisites

In order to compile the kernel we will need some tools. Let's get those.

```bash
sudo apt-get install build-essential ncurses-dev libssl-dev wget
```

We'll also need to get the kernel source and create a working directory.

```bash
mkdir linux && cd linux
wget https://cdn.kernel.org/pub/linux/kernel/v4.x/linux-4.10.2.tar.xz

```

### Let's Get Started

First, we'll need to extract the kernel from the tarball. Once it is extracted we can delete the tarball as it is no longer needed.

```bash
tar xf linux-4.10.2.tar.xz
rm -f linux-4.10.2.tar.xz
```

Now `cd` into the extracted kernel directory.

### Kernel Configuration

The Linux kernel requires a `.config` file for building. We will need to create this. You can manually create the config by going through each of the thousands of options one-by-one but that is not recommended. Instead we are going to use the config for our host OS as a baseline.

```bash
cp /boot/config-$(uname -r) .config
yes "" | make oldconfig
```

The above copies the host OS config into the config used for the kernel we are building. We then answer "yes" to any new configuration options in the vanilla kernel.

### Compiling

We are now ready to compile the kernel. This is going to take some time so go grab some coffee. When compiling the kernel we have the option to specify how many cores we should use when compiling. Check how many cores you have available with the `nproc` command. I have 8 so I am going to use 6 of those for the compiling task.

```bash
make -j6
```

Hopefully your kernel compiled successfully. If it did you can move onto the next step. We now have to compile and install the kernel modules.

```bash
sudo make modules_install install
```

Congratulations! If you've made it this far you've successfully compiled a vanilla Linux kernel that is ready for use. From here you can update grub to boot into your new kernel. However, I will be booting the kernel using the qemu emulator. I plan on writing a follow-up tutorial for this in the near future.
