FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Make the script executable
RUN chmod +x scripts/copy-static-files.sh

# Create public/static directory and copy static markdown files
RUN mkdir -p public/static
RUN cp src/pages/static/*.md public/static/

EXPOSE 5174

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
