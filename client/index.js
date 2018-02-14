#!/usr/bin/env node

let fs = require('fs');
let argv = require('yargs');

argv = argv.usage('Usage: $0 <command> [options]');

const files = fs.readdirSync('./commands');

files.forEach((commandName) => {
    const commandPath = `./commands/${commandName}`;
    argv = argv.command(require(commandPath));
});

argv.help('h').alias('h', 'help').argv; // eslint-disable-line