#!/usr/bin/node


const puppeteer = require('puppeteer')
const fs = require('fs')
const retry = require('async-retry')
const dateObj = new Date()
const actualMonth = dateObj.getUTCMonth() + 1
let actualDay = dateObj.getUTCDate() 
const actualYear = dateObj.getUTCFullYear()

const URL_BCRA_TIPO_CAMBIO = 'https://www.bcra.gob.ar/PublicacionesEstadisticas/Tipo_de_cambio_minorista.asp'

const processParams = {
    fecha: process.argv[2]
}


const ordenarFecha = async() =>{
    return new Promise(async function(resolve, reject) {
        try{
            console.log(processParams.fecha)
            if(processParams.fecha == undefined){
                console.log("ingresar fecha")
                console.log(err)
                process.exit()
            }
            let month
            let year
            const fecha = processParams.fecha.split('-')
            const day = fecha[0]
            month = fecha[1]
            year = fecha[2]

            if (year.length == 2){
                year = "20"+year
            }

            if (year > actualYear){
                console.log("Año posterior al actual")
                process.exit()
            }else if(month > actualMonth && year == actualYear){
                console.log("Mes posterior al actual")
                process.exit()
            }else{
                if (day > actualDay && month == actualMonth && year == actualYear ){
                    console.log("Dia adelantado al de la fecha")
                    process.exit()
                }
            }

            switch (month) {
                case '01':
                month = "Enero"
                break
                case '02': 
                month = "Febrero"
                break
                case '03': 
                month = "Marzo"
                break
                case '04': 
                month = "Abril"
                break
                case '05': 
                month = "Mayo"
                break
                case '06': 
                month = "Junio"
                break
                case '07': 
                month = "Julio"
                break
                case '08': 
                month = "Agosto"
                break
                case '09': 
                month = "Septiembre"
                break
                case '10': 
                month = "Octubre"
                break
                case '11': 
                month = "Noviembre"
                break
                case '12': 
                month = "Diciembre"
                break
                default:
                console.log('No se encontro el mes, revise sus datos');
            }
        const month_year = month+" "+year

        await retry(async bail => {
            await processDataRequest(day, month_year)
        })

        }catch(err){
            console.log("Fallo")
            console.log(err)
            logErrorAndExit(true)
            throw new Error(err)
        }
    })
}


const dataOutput = async () => {
    return new Promise(async function(resolve, reject) {
        try {
            
            await page.waitForSelector('#aimprimir')
            await page.waitFor(4000)
            if (await page.$('#aimprimir > div') != null){
                console.log("nose encontro la fecha, busque otra")
                process.exit()
            }

            await page.waitForSelector('#aimprimir > table.table.table-BCRA.table-bordered.table-hover.table-responsive')
            let allData = await page.$eval('#aimprimir > table.table.table-BCRA.table-bordered.table-hover.table-responsive', e => e.innerText)
            await page.waitForSelector('#aimprimir > table.table.table-BCRA.table-bordered.table-hover.table-responsive > tbody > tr')
            let lenghtColumnsInTable = (await page.$$('#aimprimir > table.table.table-BCRA.table-bordered.table-hover.table-responsive > tbody > tr')).length
            //let convertJson = JSON.parse('{data}')
            let positionInColumns
            for (positionInColumns = 5; positionInColumns < lenghtColumnsInTable; positionInColumns++) {
                    const convertStringify = JSON.stringify(allData)
                    const separateByColumn = convertStringify.split('\\n')
                    const separar2 = separateByColumn[positionInColumns].split('\\t')
                    const putJSONData = JSON.stringify({
                        "Info": {
                            "Data": [
                                {
                                    "Entidad Financiera": separar2[0],
                                    "11:00hs":{
                                    "Mostrador": {
                                        "compra":separar2[1],
                                        "venta":separar2[2]
                                        },
                                    "Electronico": {
                                        "compra":separar2[3],
                                        "venta":separar2[4]
                                        }						
                                    },
                                    "13:00hs":{
                                    "Mostrador": {
                                        "compra":separar2[5],
                                        "venta":separar2[6]
                                        },
                                    "Electronico": {
                                        "compra":separar2[7],
                                        "venta":separar2[8]
                                        }						
                                    },
                                    "15:00hs":{
                                    "Mostrador": {
                                        "compra":separar2[9],
                                        "venta":separar2[10]
                                        },
                                    "Electonico": {
                                        "compra":separar2[11],
                                        "venta":separar2[12],
                                        }						
                                    },
                                },
                            ],
                        }	
                    })
                    //const nose2 = JSON.parse(nose)
                    console.log(putJSONData)
                    
                    fs.appendFileSync("Valor_dolar_"+processParams.fecha+'.json', putJSONData)
                }
                browser.close()
                process.exit()
        } catch (err) {
            console.log(err)
            reject(err)
        }
    })
}
 

const processDataRequest = async (day,month_year) => {
    return new Promise(async function(resolve, reject) {
           try {
            await page.waitForSelector('body > div > div.contenido > div > div > div > form > div > div:nth-child(3) > select')
            await page.select('body > div > div.contenido > div > div > div > form > div > div:nth-child(3) > select', '2')

            await page.waitForSelector('body > div > div.contenido > div > div > div > form > div > div:nth-child(4) > input')
            await page.click('body > div > div.contenido > div > div > div > form > div > div:nth-child(4) > input')

            let month = await page.$eval('#tcalControls > tbody > tr > th', e => e.innerText)

            console.log(month.trim())

            while (month !== month_year) {
                month = await page.$eval('#tcalControls > tbody > tr > th', e => e.innerText)
                if (month !== month_year){
                    await page.waitForSelector('#tcalPrevMonth')
                    await page.click('#tcalPrevMonth')
               }
             }
            await page.waitForSelector('#tcalGrid > tbody > tr > td')

             let elementDays = (await page.$$('#tcalGrid > tbody > tr > td'))
            let dayInInnerText = await page.evaluate(elementDays => elementDays.innerText, elementDays[0])
             //let varible1 = await page.$$('#tcalGrid > tbody > tr > td')[0].innerText
             
             let selectday
             if(day >= 10){
                day = parseInt(day) - 1
             }else{
                day = parseInt(day)
             }
             if (day !== 1){
                selectday = day -1
             }else{
                selectday = day 
             }
             let countElementDays = 0

            while(selectday !== dayInInnerText){   
                dayInInnerText = await page.evaluate(elementDays => elementDays.innerText, elementDays[countElementDays])
                dayInInnerText  = parseInt(dayInInnerText)
                countElementDays = countElementDays + 1                
            }

             const elementDay = (await page.$$('#tcalGrid > tbody > tr > td'))[countElementDays]
             await elementDay.click()
            console.log(day, month_year)

            await page.waitForSelector('body > div.container > div.contenido > div > div > div > form > div > div:nth-child(5) > button')
            await page.click('body > div.container > div.contenido > div > div > div > form > div > div:nth-child(5) > button')

            try {
                const result = await dataOutput()
                resolve(result)
            } catch (err) {
                reject(err.message)
            }
            }catch(err){
            //browser.close()
                console.log("Fallo")
                console.log(err)
                logErrorAndExit(true)
                throw new Error(err)
                
            }

                    
    })
}

const preparePage = async () => {
    browser = await puppeteer.launch({
         headless: true,
        //headless: true,
        args: [
            '--no-sandbox',
            '--disable-features=site-per-process',
            '--disable-gpu',
            '--window-size=1920x1080',
        ]
    })
    viewPort = {
        width: 1300,
        height: 900
    }

    page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36');
    await page.setViewport(viewPort)
    await page.setDefaultNavigationTimeout(20000)
    await page.setDefaultTimeout(20000)

    await page.goto(URL_BCRA_TIPO_CAMBIO, {
        waitUntil: 'networkidle0'
    })

}

const run = async () => {
    console.log(processParams)

    // preparo el navegador e ingreso al sistema
    await retry(async bail => {
        // if anything throws, we retry
        await preparePage()
    }, {
        retries: 5,
        onRetry: async err => {
            console.log(err)
            console.log('Retrying...')
            await page.close()
            await browser.close()
        }
    })

    try {
        console.log('primer try...')
        const processResult = await ordenarFecha()
        logSuccessAndExit(processResult)
    } catch (err) {
        console.log(err)
        throw new Error(err)
    }
}

const logErrorAndExit = async error => {
    //const resultChangeStatus = await updateJobResult(processParams.job_id, 'error', null, error)
    console.log(JSON.stringify({
        state: 'failure',
     /* job_id: processParams.job_id,
        job_type: processParams.job_type,
        job_status: 'error',
        job_data: null,
        job_error: error*/

    }))

    process.exit()
}

const logSuccessAndExit = async resultData => {
    //const resultChangeStatus = await updateJobResult(processParams.job_id, 'finished', resultData, null)
    console.log(JSON.stringify({
        state: 'normal',
            /*data: {
            job_id: processParams.job_id,
            job_type: processParams.job_type,
            job_status: 'finished',
            job_data: resultData,
            job_error: null
        }*/

    }))

    process.exit()
}
run().catch(logErrorAndExit)