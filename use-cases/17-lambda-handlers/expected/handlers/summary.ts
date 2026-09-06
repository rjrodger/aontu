import { getSeneca } from '../../env/lambda/lambda'

function complete(seneca: any) {
  seneca.listen({type:'sqs',pin:'sys:summary,cmd:run'})
  seneca.client({type:'sqs',pin:'sys:store'})

  const makeGatewayHandler = seneca.export('s3-store/makeGatewayHandler')
  seneca
    .act('sys:gateway,kind:lambda,add:hook,hook:handler', {
       handler: makeGatewayHandler('sys:summary,cmd:file') })
}

exports.handler = async (
  event:any,
  context:any
) => {
  
  let seneca = await getSeneca('summary', complete)
  
  let handler = seneca.export('gateway-lambda/handler')
  let res = await handler(event, context)
  return res
}
