import {
    config
} from 'dotenv';
import ExtendedClient from './class/ExtendedClient';

config();

export const client = new ExtendedClient();

console.log('hello')

client.start();
client.loadModules();
client.deploy();
