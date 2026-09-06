import { getSeneca } from '../../env/lambda/lambda'

function complete(seneca: any) {
  seneca.listen({type:'sqs',pin:'sys:ingest,cmd:run'})
  seneca.client({type:'sqs',pin:'sys:store'})

  const makeGatewayHandler = seneca.export('s3-store/makeGatewayHandler')
  seneca
    .act('sys:gateway,kind:lambda,add:hook,hook:handler', {
       handler: makeGatewayHandler('sys:ingest,cmd:file') })
}

exports.handler = async (
  event:any,
  context:any
) => {
  
  let seneca = await getSeneca('ingest', complete)
  
  let handler = seneca.export('gateway-lambda/handler')
  let res = await handler(event, context)
  return res
}
