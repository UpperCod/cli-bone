# cli-bone

Este **CLI**, permite copiar el contenido de repositorios **GIT** en su máquina local, para ser usado como plantilla por lo que ud podrá generar un clonación dinámica a base de lo que **bone** logre recolectar.

## Instalación

```
npm install -g cli-bone
```

## bone

```
bone owner/name --dist my-folder
```

> si no se define dist, Bone insertará el contenido en el directorio de ejecución.

## opción `-u | --update`

Actualiza el repositorio local.

```
bone owner/name -u --dist my-folder
```

## opción `-r | --remove`

Eliminará el repositorio local.

```
bone owner/name -r
```

## Opciones de plantilla

### bone.config.js

Si su carpeta de plantilla posee un fichero `bone.config.js`, ud podrá generar una instancia de [**prompts**](https://github.com/terkelg/prompts), para la recolecion de parametros a utilizar en la copia a generar por Bone.

```js
export default {
   description: "my first directory template",
   questions: [
       {
           type: "text",
           name: "value",
           message: "project's name?"
       }
   ],
   onSubmit(data) {
       return data;
   },
   onCance() {
       console.log("Noooo!");
   }
};

```