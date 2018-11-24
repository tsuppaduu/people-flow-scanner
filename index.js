// Import libraries
const bluetooth = require('node-bluetooth')
const axios = require('axios')
const fs = require('fs')
const { promisify } = require('util')
const appendFile = promisify(fs.appendFile)
const readFile = promisify(fs.readFile)

// Api endpoint
const apiUrl = 'https://people-flow-back.herokuapp.com/scanners/data'

// Read data from data.txt file
const readData = async () => await readFile(`data.txt`, 'utf8')

// Append data into data.txt file
const appendData = async (data) => await appendFile('data.txt', data)

// Create bluetooth device
const device = new bluetooth.DeviceINQ()

// Bluetooth event listeners
device
  .on('found', async (address, name) => {
    await appendData(`${Date.now()} ${ address } ${ name },`)
  })
  .on('finished', async () => {
    await analyzeData()

    // Restart scanning
    scan()
  })

// Scan devices
const scan = () => device.scan()

// Analyze stored data
const analyzeData = async () => {
  const latestDevices = []
  const data = await readData()
  const rows = data.split(',').filter((row) => row)

  // Calculates the unique devices that have been detected
  // during the past minute
  rows.forEach((row) => {
    const [ timestamp, address ] = row.split(' ')
    if (timestamp >= Date.now() - 60000 && !latestDevices.includes(address)) {
      latestDevices.push(address)
    }
  })
  console.log(`Latest devices approximation: ${ latestDevices.length * 3 }`)

  // Push data into server
  try {
    await axios.post(apiUrl, {
      id: 'rasp',
      lat: 61.492636,
      lng: 23.763342,
      devices: latestDevices.length * 3
    })
  } catch (e) {
    console.log('Couldn\'nt push data into server!')
  }
}

// Start scanning
process.stdout.write('\033c')
console.log('Scanning...')
scan()