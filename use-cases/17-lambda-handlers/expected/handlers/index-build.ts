import { getSeneca } from '../../env/lambda/lambda'

function complete(seneca: any) {
  seneca.listen({type:'sqs',pin:'sys:index,cmd:build'})
  seneca.client({type:'sqs',pin:'sys:store'})
  seneca.client({type:'sqs',pin:'sys:embed'})

  const makeGatewayHandler = seneca.export('s3-store/makeGatewayHandler')
  seneca
    .act('sys:gateway,kind:lambda,add:hook,hook:handler', {
       handler: makeGatewayHandler('sys:index,cmd:file') })
}

exports.handler = async (
  event:any,
  context:any
) => {
  
  let seneca = await getSeneca('index-build', complete)
  
  let handler = seneca.export('gateway-lambda/handler')
  let res = await handler(event, context)
  return res
}
