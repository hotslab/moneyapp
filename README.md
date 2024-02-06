# moneyapp

### Before running docker-compose up

- ensure pgdata and redis folders are created by running the command

```
mkdir pgdata redis
```

- check your local user and ensure that user is the owner of the folders

```
echo $USER
ls -la redis/
ls -la pgdata/
```