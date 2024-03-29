# moneyapp

A web banking app built using **React**, **TailwindCSS**, **Axios**, **AdonisJs**, **PostgreSQL**, **Redis**, **NGINX**, **BullMq** and **Socket IO**, using **Typescript** as the main programming language, and **NodeJS** as the server environment.


## Installation

#### Development Software used

- **Host OS** - Debian 12
- **Docker Version** - 20.10.24+dfsg1, build 297e128
- **Docker-Compose Version** - 1.29.2, build unknown


#### Before running the docker container

- Clone the repository

```bash
git clone git@github.com:hotslab/moneyapp.git
cd moneyapp
```

- Create the following cache folders for the docker containers

```bash
mkdir redis/ pgdata/ npmCacheBackend/ npmCacheFrontend/
```

- Give them the permissions of your local user


```bash
sudo chown -R $USER:$USER redis/ pgdata/ npmCacheBackend/ npmCacheFrontend/
```

#### Configuring backend .env files

- Create the frontend `.env` file inside the `frontend/` folder by running the following commands:

```bash
cd frontend/
cp .env.example .env
```

#### Configuring backend .env files

- Create the following `.env` files for the *production*, *development* and *testing* environments respectively inside the `backend/` folder.

```bash
cd frontend/
cp .env.prod.example build/.env
cp .env.dev.example .env
cp .env.test.example .env.test
```

- NB: The the following `.env` fields need to be filled with the following API keys in order to use their services:  
        1. **RESEND_API_KEY** :  Create a **free** Api Key at https://resend.com/docs/api-reference/api-keys/create-api-key  
        2. **EVERAPI_KEY** : Create a **free** Api Key at https://freecurrencyapi.com/  
        

#### Starting docker

- Run the following docker command to build and start the service simultaneously

```bash
docker-compose up --build
```
- In subsequent requests you can omit the `--build` argument to stop rebuilding the containers 

- After it has started you can access the site at the http://localhost:8888.


## Architecture

### 1. Database - PostgreSQL

- The project uses **PosgreSQL** as the main database store. 
- It is chosen as it fulfills the [*ACID*](https://www.postgresql.org/about/ "PosgreSQL about page") requirements, and as a relational based database helps to keep stable data for sensitive financial information that will need to be referenced historically for the application.
- The database has three database stores, namely `moneyapp`, `moneyappdev` and `moneyapptest`. These are for the `production`,  `development` and `testing` environments. 

#### 2. NGINX

- The **NGINX** server acts as a proxy service to relay frontend requests to the backend server in the docker environment.
- This also helps in simulating and planning how the real networking of the entire application will look like.

#### 3. Redis

- **Redis** acts as the backend for the applications queue system **BullMq**, which allows it to un quicker using redis fast memory enabled processing speed.
- To act as a relay between the `SocketIO` server with the main `AdonisJS` application in broadcasting real time notifications to user clients connected to the server. This is made possible by the `Publish` and `Subscribe` features provided by redis. 

#### 4. Front End

- The front end uses ReactJs with TailwindCSS styling to provide a simple interface for client's to transact with.
- Users can register and login with credentials for security as is standard for financial applications, with email verification to ensure it is them.  
<img alt="login" src="screenshots/login.png" height="350" />
<img alt="register" src="screenshots/register.png" height="350" />

- It allows clients to open multiple foreign currency accounts.  
<img alt="client's accounts" src="screenshots/accounts.png" height="350" />
<img alt="create new account" src="screenshots/new-account.png" height="350" />

- it allows clients to deposit and withdraw money into their accounts with a simple simulated page, which in the future will be integrated with real banking interfaces like `PayPal` e.t.c.  
<img alt="deposit or withdraw" src="screenshots/deposit-or-withdraw.png" height="350" />

- It allows them to also make transfers between their own multicurrency accounts at the the prevailing exchange rates.  
<img alt="client's accounts" src="screenshots/accounts.png" height="350" />
<img alt="select account to transfer to" src="screenshots/transfer-page.png" height="350" />
<img alt="selected account initial transfer page" src="screenshots/transfer-waiting.png" height="350" />
<img alt="selected account currency conversion" src="screenshots/transfer-details.png" height="350" />
<img alt="transfer success notification" src="screenshots/transfer-notification.png" height="350" />

- Clients can also pay other users on the system using an currency account they hold, which will be transferred also at the prevailing exchange rate.  
<img alt="client's accounts" src="screenshots/accounts.png" height="350" />
<img alt="list of users to transfer to" src="screenshots/users.png" height="350" />
<img alt="accounts of selected user" src="screenshots/user-to-pay.png" height="350" />
<img alt="initial payment page" src="screenshots/payment-page.png" height="350" />
<img alt="payment currency conversion" src="screenshots/payment-details.png" height="350" />
<img alt="payment success notification" src="screenshots/payment-notification.png" height="350" />

- The system sends real time notifications of successful transactions via sockets or emails.  
<img alt="list of notifications" src="screenshots/notifications.png" height="350" />
<img alt="viewed notification" src="screenshots/viewed-notification.png" height="350" />


#### 5. Back End

- The backed is built with the `AdonisJS` api framework.
- Its uses `BullMq` as its queue manager which handles the *transaction*, *email* and *notification* queues.
- The `transaction queue` handles the transactions that are initiated by the clients when they DEPOSIT, WITHDRAW, TRANSFER and make a PAYMENT to another user.
- Each transaction is uniquely identified with an `idempotence key` to stop it from been been duplicated. 
- This key is initially generated when the user opens the transaction or withdrawal interfaces in the front end, and the key is generated by the [`uuid`](https://github.com/uuidjs/uuid#readme) npm package using the  RFC4122 uuid version 4 specification, which creates a unique key using random numbers.
- When the user submits the transaction, it is put in a queue working on the first in, first out `(FIFO)` protocol. 
- The reasons for using a queue to process transactions are:  
        **1.** To make the payments quicker on the user side whilst removing room for error due to long response times if the transaction was processed immediately after the request.  
        **2.** To enable lod balancing on the server should multiple requests be initiated simultaneously.  
        **3.** To reduce collisions when accounts are receiving and paying out money at the same time, as each transaction is processed one after the other. This is so that if one transaction reduces the account balance significantly before another simultaneous one, the next transaction will then fail gracefully should the balance be not enough for it.  
        **4.** To enable subsequent processes like sending email and socket notifications be done without the response time from the server taking long as it will be done independent of the initial request that triggered these processes.  
        **5.** To provide a means of managing transaction errors and identifying flaws in the system using [`metrics`](https://docs.bullmq.io/guide/metrics).  
- The `email queue` processes email notifications like email verification, transaction completed and so on, which are useful in notifying the user about important events.
- The `notification queue`, similar to the email queue, also provides notifications to the user. The difference between them is that the notifications are shown in realtime to the user if they are logged in the application. This is done using the socket connection.
- It also serves the secondary function of writing relevant notifications to the database for historical reasons.


## Testing

- To run unit tests, simply open a new terminal window and ssh into the backend docker server using the following command:

```bash
docker exec -it moneyapp_backend bash
```

- Run the following command to run all the unit and functional tests

```bash
node ace test --force-exit
```
- After they have finished you can exit out the terminal

```bash
exit
```