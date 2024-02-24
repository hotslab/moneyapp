# moneyapp

### Before running docker-compose up

-

```
sudo rm -R  redis/ pgdata/ npmCacheBackend/ npmCacheFrontend/
```

- ensure the local cache folders are created by running the command

```
mkdir redis/ pgdata/ npmCacheBackend/ npmCacheFrontend/
```

- ensure your local user and ensure that user is the owner of the folders before running docker-compose up --build


```
sudo chown -R $USER:$USER redis/ pgdata/ npmCacheBackend/ npmCacheFrontend/
```
