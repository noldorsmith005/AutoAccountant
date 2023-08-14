const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');


const {app, BrowserWindow, Menu, ipcMain} = electron;


let createTactWindow;
let createCatWindow;
let transactionWindow;


// Create Transaction Window Function
function createTransaction(){
    createTactWindow = new BrowserWindow({
        width: 500,
        height: 300,
        title: 'Create Transaction',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
          }
    });
    
    createTactWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'createTransaction.html'),
        protocol: 'file:',
        slashes: true
    }));
    //Garbage Collection
    createTactWindow.on('close', function(){
        createTactWindow = null
    });

}

// Create Category
function createCategory(){
    createCatWindow = new BrowserWindow({
        width: 500,
        height: 300,
        title: 'Create Category',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
          }
    });
    
    createCatWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'createCategory.html'),
        protocol: 'file:',
        slashes: true
    }));
    //Garbage Collection
    createCatWindow.on('close', function(){
        createCatWindow = null
    });

}

// View Transaction Window Function
function tactWindow(){
    transactionWindow = new BrowserWindow({
        width: 500,
        height: 300,
        title: 'View Transaction',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
          }
    });
    
    transactionWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'transactionWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    //Garbage Collection
    transactionWindow.on('close', function(){
        transactionWindow = null
    });

}




// IPC Interface
ipcMain.on('refresh', function() {
    refresh();
});

ipcMain.on('category', function(e, id) {
    displayCat(id);
});

ipcMain.on('newcat', function(e, catName) {
    newCat(catName);
});

ipcMain.on('editCat', function(e, catName, id) {
    editCat(catName, id);
});

ipcMain.on('delCat', function(e, id) {
    delCat(id);
});

ipcMain.on('getCats', function() {
    getCats();
});

ipcMain.on('transaction', function(e, id) {
    tactWindow();
    setTimeout(displayTact, 500, id);
});

ipcMain.on('newtact', function(e, label, category, event, sr, amount, tType) {
    newTact(label, category, event, sr, amount, tType);
});

ipcMain.on('edtact', function(e, label, event, sr, amount, tType, id) {
    editTact(label, event, sr, amount, tType, id);
});

ipcMain.on('deltact', function(e, id) {
    deleteTact(id);
});






// UTILITY FUNCTIONS

const dataFile = path.join(__dirname, 'local_data.json')

    // Calculate
function calculate() {
    fs.readFile(dataFile, "utf8", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        try {
            const data = JSON.parse(jsonString);
            const cats = data.categories;
            const tacts = data.transactions;

            for (cat of cats) {
                var value1 = 0;
                var value2 = 0;
                for (tact of tacts) {
                    if (tact.category == cat.category) {
                        if (tact.label == "Income") {
                            value1 += tact.amount;
                        }
                        else if (tact.label == "Expense") {
                            value2 += tact.amount;
                        }
                    }
                }
                cat.total_income = value1;
                cat.total_expense = value2;
            }

            const jsonData = JSON.stringify(data, null, 4);
            fs.writeFile (dataFile, jsonData, function(err) {
                if (err) throw err;
                }
            );
            
        } 
        catch (err) {
            console.log("Error parsing JSON string:", err);
        }
    })
};


    //Refresh
function refresh() {
    calculate();
    fs.readFile(dataFile, "utf8", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        try {
            const data = JSON.parse(jsonString);
            const cats = data.categories;
            var totalIncome = 0;
            var totalExpense = 0;
            var totalProfit = 0;
            for (block of cats) { 
                const calcedprof = block.total_income - block.total_expense;
                const category = block.category;
                const id = block.id;
                const income = `$${block.total_income.toString()}`;
                const expense = `$${block.total_expense.toString()}`;
                const profit = `$${calcedprof.toString()}`;

                totalIncome += block.total_income;
                totalExpense += block.total_expense;
                totalProfit += calcedprof;

                mainWindow.webContents.send('block', id, category, income, expense, profit);

            };
            mainWindow.webContents.send('totals', `$${totalIncome.toString()}`, `$${totalExpense.toString()}`, `$${totalProfit.toString()}`);

          } catch (err) {
            console.log("Error parsing JSON string:", err);
        }
    })
};

    // Display Transaction
function displayTact(id) {
    fs.readFile(dataFile, "utf8", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        try {
            const data = JSON.parse(jsonString);
            const tacts = data.transactions;

            for (tact of tacts) {
                if (tact.id == id) {
                    const label = tact.label;
                    const event = tact.event;
                    const sr = tact.sr; 
                    const amount = tact.amount;
                    const tType = tact.transaction_type;

                    transactionWindow.webContents.send('transaction', label, event, sr, `$${amount.toString()}`, tType, id);
                }
            }
           
          } catch (err) {
            console.log("Error parsing JSON string:", err);
        }
    });
    
};

    // Edit Transaction
 function editTact(label, event, sr, amount, tType, id) {
    fs.readFile(dataFile, "utf8", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        try {
            const data = JSON.parse(jsonString);
            const tacts = data.transactions;

            try {
                amount = parseInt(amount);
            }
            catch (err) {
                console.log(err);
            }

            for (tact of tacts) {
                if (tact.id == id) {
                    tact.label = label;
                    tact.event = event;
                    tact.sr = sr; 
                    tact.amount = amount;
                    tact.transaction_type = tType;

                    const jsonData = JSON.stringify(data, null, 4);
                    fs.writeFile (dataFile, jsonData, function(err) {
                        if (err) throw err;
                        }
                    );
                }
            }
           
          } catch (err) {
            console.log("Error parsing JSON string:", err);
        }
    });
    
};

    //Create Transaction
function newTact(label, category, event, sr, amount, tType) {
    fs.readFile(dataFile, "utf8", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        try {
            const data = JSON.parse(jsonString);
            const tacts = data.transactions;
            const IDS = data.IDS;

            const random = Math.floor(Math.random() * 1000) + 1; 

            if (IDS.length !== 1000) {
                while (IDS.includes(random)) {
                    random = Math.floor(Math.random() * 1000) + 1; 
                }
                IDS.push(random);
            }
            else {
                console.log("Over limit");
            }

            try {
                amount = parseInt(amount);
            }
            catch (err) {
                console.log(err);
            }

            const nTact = {
                id: random,
                label: label,
                category: category,
                event: event,
                sr: sr,
                amount: amount, 
                transaction_type: tType
            }

            tacts.push(nTact);
          
            const jsonData = JSON.stringify(data, null, 4);
            fs.writeFile (dataFile, jsonData, function(err) {
                if (err) throw err;
                }
            );
        } catch (err) {
            console.log("Error parsing JSON string:", err);
        }
    });
};

    // Delete Transaction
 function deleteTact(id) {
    fs.readFile(dataFile, "utf8", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        try {
            const data = JSON.parse(jsonString);
            const tacts = data.transactions;
            const IDS = data.IDS;

            for (tact of tacts) {
                if (tact.id == id) {
                    index = tacts.indexOf(tact);
                    tacts.splice(index, 1);

                    for (ident of IDS) {
                        if (ident == id) {
                            idIndex = IDS.indexOf(ident);
                            IDS.splice(idIndex, 1);
                        }
                    }
                }
            };

            const jsonData = JSON.stringify(data, null, 4);
            fs.writeFile (dataFile, jsonData, function(err) {
                if (err) throw err;
                }
            );
           
          } catch (err) {
            console.log("Error parsing JSON string:", err);
        }
    });
    
};

    //Display Category
function displayCat(id) {
    fs.readFile(dataFile, "utf8", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        try {
            const data = JSON.parse(jsonString);
            const cats = data.categories;
            const tacts = data.transactions;

            for (cat of cats) {
                if (id == cat.id) {
                    for (tact of tacts) {
                        if (tact.category == cat.category) {
                            const category = tact.category;
                            const id = tact.id;
                            const label = tact.label;
                            const amount = tact.amount;

                            mainWindow.webContents.send('category', category, id, label, `$${amount.toString()}`);
                        }
                    }
                }
            };

          } catch (err) {
            console.log("Error parsing JSON string:", err);
        }
    });
};

    //Create Category
function newCat(catName) {
    fs.readFile(dataFile, "utf8", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        try {
            const data = JSON.parse(jsonString);
            const cats = data.categories;
            const CIDS = data.CIDS;

            const random = Math.floor(Math.random() * 50) + 1; 

            if (CIDS.length !== 1000) {
                while (CIDS.includes(random)) {
                    random = Math.floor(Math.random() * 50) + 1; 
                }
                CIDS.push(random);
            }
            else {
                console.log("Over limit");
            }

            const nCat = {
                id: random,
                category: catName,
                total_income: 0,
                total_expense: 0
            }

            cats.push(nCat);
          
            const jsonData = JSON.stringify(data, null, 4);
            fs.writeFile (dataFile, jsonData, function(err) {
                if (err) throw err;
                }
            );
        } catch (err) {
            console.log("Error parsing JSON string:", err);
        }
    });
};

    //Edit Category
function editCat(catName, id) {
    fs.readFile(dataFile, "utf8", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        try {
            const data = JSON.parse(jsonString);
            const cats = data.categories;
            const tacts = data.transactions;

            for (cat of cats) {
                if (cat.id == id) {
                    for (tact of tacts) {
                        if (tact.category == cat.category) {
                            tact.category = catName;
                        }
                    }
                    cat.category = catName;
                }
            };
          
            const jsonData = JSON.stringify(data, null, 4);
            fs.writeFile (dataFile, jsonData, function(err) {
                if (err) throw err;
                }
            );
        } catch (err) {
            console.log("Error parsing JSON string:", err);
        }
    });
};

   //Delete Category
function delCat(id) {
    fs.readFile(dataFile, "utf8", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        try {
            const data = JSON.parse(jsonString);
            const cats = data.categories;
            const tacts = data.transactions;
            const IDS = data.IDS;
            const CIDS = data.CIDS;

            var delIDS = []

            for (cat of cats) {
                if (cat.id == id) {
                    for (tact of tacts) {
                        if (tact.category == cat.category) {
                            delIDS.push(tact.id);
                        }
                    }
                    newTacts = tacts.filter((tact) => tact.category != cat.category);
                    data.transactions = newTacts;

                    newIDS = IDS.filter((ident) => !delIDS.includes(ident));
                    data.IDS = newIDS;

                    index = cats.indexOf(cat);
                    cats.splice(index, 1);
                
                    for (cid of CIDS) {
                        if (cid == id) {
                            index = CIDS.indexOf(cid);
                            CIDS.splice(index, 1);
                        }
                    };
                }
            };

            const jsonData = JSON.stringify(data, null, 4);
            fs.writeFile (dataFile, jsonData, function(err) {
                if (err) throw err;
                }
            );
            
        } catch (err) {
            console.log("Error parsing JSON string:", err);
        }
    });
};

    // Get Categories
function getCats() {
    fs.readFile(dataFile, "utf8", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        try {
            const data = JSON.parse(jsonString);
            const cats = data.categories;
            var catList = [];

            for (cat of cats) {
                catList.push(cat.category)
            }
            createTactWindow.webContents.send('getCats', catList);
           
          } catch (err) {
            console.log("Error parsing JSON string:", err);
        }
    });
    
};





///   STARTUP   ///
app.on('ready', function(){
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
          }
    });


    // Main Window Function
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));


    // Quit app when closed
    mainWindow.on('closed', function(){
        app.quit();
    });


    // Menu Build
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert Menu
    Menu.setApplicationMenu(mainMenu);
});






// Main Menu Template
const mainMenuTemplate = [
    {
        label:'Actions',
        submenu: [
            {
                label:'Create Transaction',
                click(){
                    createTransaction();
                }
            },
            {
                label:'Create Category',
                click(){
                    createCategory();
                }
            },
            {
                label:'Quit',
                click(){
                    app.quit();
                }
            }
        ]
        
    }
];


// OS Optimization  
if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({label: "AutoAccountant"});
}
