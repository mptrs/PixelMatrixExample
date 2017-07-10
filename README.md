# PixelMatrix
A few weeks ago I created this

![Yoshi - PixelMatrix](https://github.com/mptrs/PixelMatrixExample/raw/master/yoshi.gif)

I call it PixelMatrix and it's build with a Raspberry Pi Zero W.

The idea came when we wanted to add a gif to a picture frame to give it some action. This was not possible :(

I remembered the Pixel project that got funded on Kickstarter, but wanted to give it a try myself.

It's far from finished, but the foundation is done. Read on if you'd like to give it a try yourself.

For help message me here on github, create and issue or tweet me [@wishjuh](https://twitter.com/wishjuh)

## Hardware
At the core there is a Raspberry Pi Zero W cause it's so tiny! On top of it there is an [Adafruit RGB Matrix HAT](https://www.adafruit.com/product/2345). You could wire it all yourself, but this HAT makes it easier and saver.

Then all you need is the pixel matrix which I got from my friends at [Aliexpress](https://www.aliexpress.com/item/192X192mm-32X16-pixels-1-16-scan-3in1-SMD-RGB-full-color-p6-led-module-for-indoor/32731095336.html) and when you there add some [power](https://www.aliexpress.com/item/1PCS-5V4A-AC-100V-240V-Converter-Adapter-DC-5V-4A-4000mA-Power-Supply-EU-Plug-5/32729613841.html) too. I'm from Europe so I linked a EU plug :)

Almost forgot to mention the frame, a [Ribba](http://www.ikea.com/us/en/catalog/products/00078032/) from Ikea.

## Software
Because I don't need a GUI I installed [RASPBIAN JESSIE LITE](https://www.raspberrypi.org/downloads/raspbian/). To make it easy to flash this on a SD card I did use a GUI tho, my trusty friend [Etcher](https://etcher.io/), which is amazing!

After flashing you SD and booting up you'll need some internet. This [post](https://davidmaitland.me/2015/12/raspberry-pi-zero-headless-setup/) helped me out, but all you need is this part:

Edit the file etc/wpa_supplicant/wpa_supplicant.conf. 
(`sudo nano etc/wpa_supplicant/wpa_supplicant.conf`)

Add this to the end:

    network={ 
        ssid="my network name"
        psk="my network password"
        proto=RSN
        key_mgmt=WPA-PSK
        pairwise=CCMP
        auth_alg=OPEN
    }

Reboot your Pi and you should be connected to Wifi to run this

    sudo apt-get update -y
    sudo apt-get upgrade -y

Node.js is required so it's best to install the latest Raspberry Pi compatible one. I used the following code

    wget https://nodejs.org/dist/latest-v6.x/node-v6.10.3-linux-armv6l.tar.gz

    tar -xvf node-v6.10.3-linux-armv6l.tar.gz
    cd node-v6.10.3-linux-armv6l
    sudo cp -R * /usr/local/
    sudo reboot

When your Pi is up and running again you can clone this repo `git clone https://github.com/mptrs/PixelMatrixExample.git`

When it's done `cd` into the folder and run `sudo npm install --unsafe-perm --verbose` this is needed to MAKE the part of the code that will control the pixel matrix.

## Examples

    $ sudo node app.js --rain
    $ sudo node app.js --perlin
    $ sudo node app.js --animation animations/32x32/pacman.gif
    $ sudo node app.js --animation animations/32x32/tree.gif

## Todo

- [ ] create webinterface
- [ ] make it bigger
- [ ] look at the pixelpusher protocol
- [ ] look at processing.org

### Credits
[hzeller](https://github.com/hzeller/rpi-rgb-led-matrix) for the library to control the pixels and [meg768](https://github.com/meg768/hzeller-matrix-example) for the JS implementation which I copied. Will alter that code when I get a better understanding of it.