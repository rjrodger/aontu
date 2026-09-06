import { getSeneca } from '../../env/lambda/lambda'

function complete(seneca: any) {
  seneca.listen({type:'sqs',pin:'sys:notify,cmd:send'})
}

exports.handler = async (
  event:any,
  context:any
) => {
  
  let seneca = await getSeneca('notify', complete)
  
  let handler = seneca.export('gateway-lambda/handler')
  let res = await handler(event, context)
  return res
}
