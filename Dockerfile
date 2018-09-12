# Build the Dockerfile with this command: docker build -t joecoolish/dynamic-images .
# All Dockerfile files start with a "FROM".  I added an alas (as builder) so that I can reference it later
FROM node as builder

# Just an FYI line.  Not needed
MAINTAINER Joel Day joel.day@microsoft.com

# From here on out, we'll be working in the /user/src/app directory. If it doesn't exist, create it!
WORKDIR /usr/src/app

# Copy everything from the root directory of the folder I'm in on my host (first dot) to the current working directory in the container
# I do other copying below.  The copy syntax can have * and ? for wild cards.  If the item ends with a / then it's treated like a folder
COPY . .

# Execute the following scripts in the container.  These install the dependencies and build the app
RUN npm install
RUN npm run build


# Part 2: the release.  Use alpine-node version 10.8, cuz it's small
FROM mhart/alpine-node:10.8

# Same as above
WORKDIR /usr/src/app

# Now, let's just copy over the stuff we need.  The line below would copy EVERYTHING (which is like 360MB), we only need the files we need
#COPY --from=builder /usr/src/app/ .
COPY --from=builder /usr/src/app/dist/ ./dist/
COPY --from=builder /usr/src/app/server/ ./server/
COPY --from=builder /usr/src/app/server.js ./

RUN apk add vips-dev fftw-dev --update-cache --repository https://dl-3.alpinelinux.org/alpine/edge/testing/
RUN apk add --update binutils g++ gcc make

# We also need the npm package express installed
RUN npm install express
RUN npm install dotenv
RUN npm install chokidar
RUN npm install sharp
RUN npm install multer
RUN npm install request

# We need to make sure that the port 3000 is exposed.  Spoiler!  This actually doesn't expose the port!  I don't think this line is necessary
# To expose the port, when we create the container, we use the -p flag.  W/o that, the port doesn't get exposed
EXPOSE 3000

# If nothing is passed into the Container at the end of the build statement, do the following (launch the server)
CMD [ "node", "server.js" ]

# Example container creation script:
#            -ti Run in interactive mode
#                --rm Clean up container after the console exits
#                     -v says "Share C:\ (notice the direction of the slash!  It's deliberate!) with /usr/src/imgs in the container"
#                                                -p Is where we expose the port.  First one is the host port, second is the container.
# docker run -ti --rm -v c:/images:/usr/src/imgs -p 3000:3000 joecoolish/dynamic-images
