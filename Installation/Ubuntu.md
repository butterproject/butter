# Ubuntu installing instruction (Beginner Friendly)

Open terminal 

Run the following commands (You may need to use sudo if any of the commands dont work):

- Run the update and upgrade to your system.

`apt-get --yes update && apt-get --yes upgrade`

- Install Curl, Git and Python globally (Skip this step if you already have them installed.)

`apt-get --yes install -y curl git pyton`

- Do a curl request to the following link 

`curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash`

- Install nodejs and npm globally Skip this step if you already have them installed.)

`apt-get --yes install -y nodejs`
`sudo npm install -g npm`

- Check if nodejs and npm where installed

`nodejs --version`
`npm --version`

- Clone the git repository

` git clone https://github.com/butterproject/butter-desktop-angular.git /wanteddirectory/`

- Install bower and Grunt

```cd /wanteddirectory/
npm install -g bower grunt-cli
npm install
bower install``` 


- Build the application

`grunt build`

- Start the application 

`grunt start`


